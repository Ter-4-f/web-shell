package com.teraf.webshell.dataaccess;

import com.jcraft.jsch.*;
import com.teraf.webshell.model.Command;
import com.teraf.webshell.model.ProblemException;
import com.teraf.webshell.model.SshConnection;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeoutException;

@Slf4j
@Component
@RequiredArgsConstructor
public class SshDAO {

    @SneakyThrows
    public Mono<SshConnection> createConnection(String address, int port, String user, String password) {
        // Init session
        Session session = new JSch().getSession(user, address, port);
        session.setPassword(password);
        session.setConfig("StrictHostKeyChecking", "no");
        session.connect();
        // Init shell-channel
        ChannelShell channel = (ChannelShell) session.openChannel("shell");
//        channel.setPty(true); // with sending 3
        channel.connect();
        channel.start();

        var output = Flux.<String>create(emitter -> {
                    try {
                        var reader = new InputStreamReader(channel.getInputStream());
                        var buffer = new char[4096];
                        int bytesRead;  

                        // Loop until the end of the stream is reached
                        while ((bytesRead = reader.read(buffer)) != -1) {
                            emitter.next(new String(buffer, 0,  bytesRead));
                        }
                        emitter.complete();
                    } catch (Exception e) {
                        emitter.error(e);
                    }
                })
//                .flatMap(line -> {
//                    String escapeSequenceRegex = "\\x1B\\[[0-?]*[ -/]*[@-~][\\r]?";
//                    var result = line.replaceAll(escapeSequenceRegex, "");
//                    if (result.isBlank())
//                        return Mono.empty();
//                    else
//                        return Mono.just(result);
//                })
//                .filter(line -> !line.isBlank())
                // TODO filter out all commands, to have a clear history
                .filter(line -> !"\u0007".equals(line)) // filter out bell sound
                .doOnNext(s -> System.out.println(STR."Line: '\{StringEscapeUtils.escapeJava(s)}'"))
                .map(StringEscapeUtils::escapeJava)
                .map(line -> {
//                    if (line.startsWith("\r"))
//                        return line.replaceFirst("\r", "\\\\r");
                    return line.replaceAll(" ", "\\\\u0020");
                })
                .cache();

        output.subscribeOn(Schedulers.boundedElastic()).subscribe();
        output.timeout(Duration.ofSeconds(1))
                .doOnError(TimeoutException.class, e -> {
                    log.info("Initialisation-Timeout occurred, send check");
                    this.executeSignal(channel, "\n");
                })
                .next()
                .doOnNext(s -> log.warn(STR."Swallowed first message: \{s}"))
                .onErrorResume(e -> Mono.empty())
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();

        return Mono.just(SshConnection.builder()
                .id(UUID.randomUUID())
                .session(session)
                .shell(channel)
                .output(output)
                .createdAt(LocalDateTime.now())
                .build()
        );
    }



    public Mono<Boolean> executeCommand(ChannelShell channel, String command) {
        return executeSignal(channel, STR."\{command}\n");
    }

    public Mono<Boolean> executeSignal(ChannelShell channel, String signal) {
        try {
            OutputStream out = channel.getOutputStream();
            out.write(signal.getBytes());
            out.flush();
            return Mono.just(true);
        } catch (Exception e) {
            return Mono.error(new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to send command to remote server", e));
        }
    }

    @SneakyThrows
    public Mono<String> executeCommand(String address, int port, String user, String password, String command) {
        Session session = null;
        ChannelExec channel = null;

        try {
            session = new JSch().getSession(user, address, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand(command);
            ByteArrayOutputStream responseStream = new ByteArrayOutputStream();
            channel.setOutputStream(responseStream);
            channel.connect();

            while (channel.isConnected()) {
                Thread.sleep(100);
            }

            return Mono.just(new String(responseStream.toByteArray()));

        } catch (Exception e) {
            return Mono.error(e);
        }
        finally {
            if (session != null) {
                session.disconnect();
            }
            if (channel != null) {
                channel.disconnect();
            }
        }
    }



    @SneakyThrows
    private String readOutput(InputStream in) {
        byte[] buffer = new byte[1024];
        int bytesRead;
        StringBuilder response = new StringBuilder("");
        while ((bytesRead = in.read(buffer)) != -1) {
            String escapeSequenceRegex = "\\x1B\\[[0-?]*[ -/]*[@-~][\\r]?";
            var raw = new String(buffer, 0, bytesRead, StandardCharsets.UTF_8);
            String cleaned = raw.replaceAll(escapeSequenceRegex, "");
            response.append(cleaned);
            if (reachedEnd(cleaned)) {
                return response.toString();
            }
            Thread.sleep(100);
        }

        return response.toString();
    }

    private boolean reachedEnd (String output) {
        var lines = output.split("\n");
        var lastLine = lines[lines.length -1].strip();
        return lastLine.startsWith("teraf@home") && (lastLine.endsWith("$") || lastLine.endsWith("#"));
    }
}
