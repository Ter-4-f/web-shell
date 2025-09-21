package com.teraf.webshell.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import lombok.Getter;
import reactor.core.publisher.Flux;

@Getter
public class Command {

    private final String command;
    private final String cwd;
    private final long pid;
    private final List<String> output;
    private final Flux<String> outputStream;
    private final Process process;
    private final LocalDateTime startedAt;
    Optional<LocalDateTime> endedAt;


    

    public Command(String command, String cwd, long pid, List<String> output, Flux<String> outputStream,
            Process process) {
        this.command = command;
        this.cwd = cwd;
        this.pid = pid;
        this.output = output;
        this.outputStream = outputStream;
        this.process = process;
        this.startedAt = LocalDateTime.now();
        this.endedAt = Optional.empty();

        process.onExit().thenRunAsync(() -> {this.endedAt = Optional.of(LocalDateTime.now()); });
    }

    public Optional<Integer> getExitCode () {
        if (process.isAlive())
            return Optional.empty();
        
        return Optional.of(process.exitValue());
    }

    public CommandDTO toDTO () { return toDTO(false); }

    public CommandDTO toDTO (boolean masked) {
        var diff = ChronoUnit.MILLIS.between(this.startedAt, this.endedAt.orElse(LocalDateTime.now()));
        var builder = CommandDTO.builder()
                .command(masked ? "" : command)
                .cwd(masked ? "" : cwd)
                .pid(masked ? 0 : pid)
                .output(output)
                .duration(diff)
                .startedAt(startedAt.format(DateTimeFormatter.ISO_DATE_TIME));
       
        if (!process.isAlive())
            builder.exitCode(process.exitValue());
            

        return builder.build();                    
    }
    
}
