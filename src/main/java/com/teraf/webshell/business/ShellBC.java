package com.teraf.webshell.business;

import java.util.UUID;

import com.teraf.webshell.model.Command;
import com.teraf.webshell.model.Config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.teraf.webshell.dataaccess.ShellDAO;
import com.teraf.webshell.model.ProblemException;
import com.teraf.webshell.model.Shell;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShellBC {

    private final ShellDAO shellDAO;
    private final Config config;

    public Flux<Shell> loadShells () {
        return shellDAO.loadShells()
                .switchIfEmpty(Mono.just(new Shell(config.getStartDir())));
    }

    public Shell loadShell (UUID id) {
        return shellDAO.loadShell(id)
                .orElseThrow(() -> ProblemException.create(HttpStatus.NOT_FOUND, "Shell does not exist", null));
    }

    public Flux<String> loadActiveOutput (UUID id) {
        var command = loadShell(id).getNewestCommand();
        return command.getOutputStream();
    }

    public Mono<Command> cancelCommand (UUID id) {
        var command = loadShell(id).getNewestCommand();
        var process = command.getProcess();
        process.destroy();
        if (process.isAlive()) {
            log.warn("Process '{}' from command '{}' of shell '{}' hat to be forcibly terminated", command.getPid(), command.getCommand(), id.toString());
            process.destroyForcibly();
        }

        return Mono.just(command);
    }
}
