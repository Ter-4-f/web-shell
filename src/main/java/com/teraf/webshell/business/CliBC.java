package com.teraf.webshell.business;

import com.teraf.webshell.model.Command;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.teraf.webshell.dataaccess.CliDAO;
import com.teraf.webshell.dataaccess.ShellDAO;
import com.teraf.webshell.model.Config;
import com.teraf.webshell.model.ProblemException;
import com.teraf.webshell.model.Shell;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.concurrent.TimeoutException;

@Component
@RequiredArgsConstructor
public class CliBC {

    private final CliDAO cliDAO;
    private final ShellDAO shellDAO;
    private final Config config;

    public Mono<Shell> executeCommand (String cli) {
        var commandMono = cliDAO.executeCommand(config.getStartDir(), cli)
                .onErrorMap(e -> ProblemException.create(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to execute the command '%s'".formatted(cli), e))
                .cache();

        var shellMono = commandMono.map(Shell::new)
                .doOnNext(shellDAO::saveShell);

        var delayMono = commandMono.flatMap(command -> command.getOutputStream()
                .next()
                .timeout(config.getWaitForFirstOutputLine())
                .switchIfEmpty(Mono.just("empty"))
                .onErrorResume(TimeoutException.class, e -> Mono.just("timeout"))
        );

        return Mono.zip(shellMono, delayMono)
                .map(Tuple2::getT1);
    }

    public Mono<Command> killPc () {
        return cliDAO.executeCommand(config.getStartDir(), config.getKillCommand())
                .onErrorMap(e -> ProblemException.create(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to shut down the PC", e));
    }
}
