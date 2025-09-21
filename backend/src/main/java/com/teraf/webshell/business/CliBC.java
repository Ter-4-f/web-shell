package com.teraf.webshell.business;

import com.teraf.webshell.config.Config;
import com.teraf.webshell.dataaccess.SshConnectionDB;
import com.teraf.webshell.dataaccess.SshDAO;
import com.teraf.webshell.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.util.annotation.Nullable;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class CliBC {

    private final SshConnectionDB connectionDB;
    private final SshDAO sshDAO;
    private final Config config;

    public Mono<SshConnection> executeCommand(@Nullable String cli, ServerData location) {
        var connection = sshDAO.createConnection(location.getIp(), location.getPort(), location.getUsername(), location.getPassword())
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
        else {
            String execCommand = "\r\u001b[K" + command;
            return sshDAO.executeCommand(connection.getShell(), execCommand);
        }
    }

    public Mono<String> killPc (ServerData location) {
        return sshDAO.executeCommand(location.getIp(), location.getPort(), location.getUsername(), location.getPassword(), location.getKillCommand())
                .onErrorMap(e -> new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to shut down the PC", e));
    }

    public Mono<Boolean> cancelCommand (UUID shellId) {
        var connection = connectionDB.loadConnection(shellId)
                .orElseThrow(() -> new ProblemException(HttpStatus.NOT_FOUND, "No open shell with the provided id."));
        try {
            return sshDAO.executeSignal(connection.getShell(), "\u0003");
        } catch (Exception e) {
            log.error("Unable to cancel command for the shell '{}' at {}:{}", connection.getId().toString(), connection.getSession().getHost(), connection.getSession().getPort(), e);
            return Mono.error(new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to cancel the command"));
        }
    }
}
