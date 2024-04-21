package com.teraf.webshell.business;

import com.teraf.webshell.config.Config;
import com.teraf.webshell.dataaccess.SshConnectionDB;
import com.teraf.webshell.dataaccess.SshDAO;
import com.teraf.webshell.model.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.util.annotation.Nullable;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CliBC {

    private final SshConnectionDB connectionDB;
    private final SshDAO sshDAO;
    private final Config config;

    public Mono<SshConnection> executeCommand(@Nullable String cli, ServerData location) {
        var connection = sshDAO.createConnection(location.getHost(), location.getPort(), location.getUsername(), location.getPassword())
                .onErrorMap(e -> new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to connect to server.", e))
                .doOnNext(connectionDB::saveConnection);

        if (cli != null && !cli.isBlank())
            connection = connection.doOnNext(session -> sshDAO.executeCommand(session.getShell(), cli));

        return connection;
    }

    public Mono<Boolean> executeCommand(UUID shellId, String command, boolean asSignal) {
        var connection = connectionDB.loadConnection(shellId)
                .orElseThrow(() -> new ProblemException(HttpStatus.NOT_FOUND, "No open shell with the provided id."));

        if (asSignal)
            return sshDAO.executeSignal(connection.getShell(), command);
        else
            return sshDAO.executeCommand(connection.getShell(), command);
    }

    public Mono<String> killPc (ServerData location) {
        return sshDAO.executeCommand(location.getHost(), location.getPort(), location.getUsername(), location.getPassword(), config.getKillCommand())
                .onErrorMap(e -> new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to shut down the PC", e));
    }
}
