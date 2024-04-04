package com.teraf.webshell.business;

import java.util.UUID;

import com.teraf.webshell.config.Config;
import com.teraf.webshell.dataaccess.SshConnectionDB;
import com.teraf.webshell.dataaccess.SshDAO;
import com.teraf.webshell.model.*;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShellBC {

    private final SshDAO sshDAO;
    private final SshConnectionDB connectionDAO;
    private final Config config;

    public Flux<SshConnection> loadShells (@NonNull ServerData location) {
        return connectionDAO.loadConnections()
                .filter(connection -> connection.isConnectedToServer(location))
                .switchIfEmpty(sshDAO.createConnection(location.getHost(),location.getPort(), location.getUsername(), location.getPassword()));
    }

    public SshConnection loadConnection(@NonNull UUID id) {
        return connectionDAO.loadConnection(id)
                .orElseThrow(() -> new ProblemException(HttpStatus.NOT_FOUND, STR."Shell with id '\{id.toString()}' does not exist"));
    }

    public Flux<String> loadActiveOutput (UUID id) {
        return loadConnection(id).getOutput();
    }

    public Mono<Boolean> cancelCommand (UUID id) {
        var connection = loadConnection(id);
        try {
            connection.getShell().sendSignal("INT");
            return Mono.just(true);
        } catch (Exception e) {
            log.error("Unable to cancel command for the shell '{}' at {}:{}", connection.getId().toString(), connection.getSession().getHost(), connection.getSession().getPort(), e);
            return Mono.error(new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to cancel the command"));
        }
    }
}
