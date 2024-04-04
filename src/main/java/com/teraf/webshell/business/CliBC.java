package com.teraf.webshell.business;

import com.teraf.webshell.config.Config;
import com.teraf.webshell.dataaccess.SshConnectionDB;
import com.teraf.webshell.dataaccess.SshDAO;
import com.teraf.webshell.model.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@RequiredArgsConstructor
public class CliBC {

    private final SshConnectionDB connectionDB;
    private final SshDAO sshDAO;
    private final Config config;

    public Mono<SshConnection> executeCommand (String cli, ServerData location) {
        return sshDAO.createConnection(location.getHost(), location.getPort(), location.getUsername(), location.getPassword())
                .onErrorMap(e -> new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to connect to server.", e))
                .doOnNext(session -> {
                    var output = sshDAO.executeCommand(session.getShell(), cli);
                    session.setOutput(output);
                    output.subscribeOn(Schedulers.boundedElastic()).subscribe();
                })
                .doOnNext(connectionDB::saveConnection);
    }

    public Mono<String> killPc (ServerData location) {
        return sshDAO.executeCommand(location.getHost(), location.getPort(), location.getUsername(), location.getPassword(), config.getKillCommand())
                .onErrorMap(e -> new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to shut down the PC", e));
    }
}
