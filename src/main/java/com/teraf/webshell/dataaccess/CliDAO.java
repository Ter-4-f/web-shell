package com.teraf.webshell.dataaccess;

import java.io.*;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.fasterxml.jackson.core.JsonToken;
import org.springframework.stereotype.Component;

import com.teraf.webshell.model.Command;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@RequiredArgsConstructor
public class CliDAO {

    @SneakyThrows
    public Mono<Command> executeCommand(String cwd, String command) {
        var output = new ArrayList<String>();
        var process = new ProcessBuilder()
                .redirectErrorStream(true)
                .directory(new File(cwd))
                .command(splitCommand(command))
                .start();

        var generateFlux = Flux.<String>create(emitter -> {
                    try {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                        String line;
                        while ((line = reader.readLine()) != null) {
                            emitter.next(line);
                        }
                        emitter.complete();
                    } catch (Exception e) {
                        emitter.error(e);
                    }
                })
                .doOnNext(line -> {
                        if (!output.isEmpty() && output.get(output.size() -1).endsWith("\r"))
                            output.set(output.size() -1, line);
                        else
                            output.add(line);
                })
                .cache();

        return Mono.just(new Command(command, cwd, process.pid(), output, generateFlux, process))
                .doOnNext(shell -> generateFlux.subscribeOn(Schedulers.boundedElastic()).subscribe());
    }



    private String[] splitCommand (String command) {
        var openedQuote = false;
        var partStart = 0;
        var letters = command.toCharArray();
        var parts = new ArrayList<String>();

        for (int i = 1; i < letters.length; i++) {
            var isQuote = letters[i] == '\'' || letters[i] == '\"';
            if (openedQuote && isQuote)
                openedQuote = false;
            else {
                if (isQuote)
                    openedQuote = true;
                else if (letters[i] == ' ') {
                    parts.add(command.substring(partStart, i));
                    partStart = i + 1;
                }
            }
        }
        parts.add(command.substring(partStart));
        return parts.toArray(new String[0]);
    }
}
