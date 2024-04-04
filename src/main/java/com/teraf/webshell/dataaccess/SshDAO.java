package com.teraf.webshell.dataaccess;

import com.jcraft.jsch.*;
import com.teraf.webshell.model.Command;
import com.teraf.webshell.model.ProblemException;
import com.teraf.webshell.model.SshConnection;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

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

        return Mono.just(SshConnection.builder()
                .id(UUID.randomUUID())
                .session(session)
                .shell(channel)
                .output(Flux.empty())
                .createdAt(LocalDateTime.now())
                .build()
        );
    }


    @SneakyThrows
    public Flux<String> executeCommand(ChannelShell channel, String command) {
        OutputStream out = channel.getOutputStream();
        sendCommand(out, command);

        return Flux.<String>create(emitter -> {
                    try {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(channel.getInputStream()));
                        String line;
                        while ((line = reader.readLine()) != null) {
                            emitter.next(line);
                        }
                        emitter.complete();
                    } catch (Exception e) {
                        emitter.error(e);
                    }
                })
                .doOnNext(System.out::println)
                .cache();
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












    private void sendCommand(OutputStream out, String command) {
        try {
            out.write((command + "\n").getBytes());
            out.flush();
        } catch (Exception e) {
            throw new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to send command to remote server", e);
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
