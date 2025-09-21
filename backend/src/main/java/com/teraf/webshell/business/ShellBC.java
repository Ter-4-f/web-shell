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
    private final SshConnectionDB connectionDB;
    private final Config config;

    public Flux<SshConnection> loadShells (@NonNull ServerData location) {
        return connectionDB.loadConnections()
                .filter(connection -> connection.isConnectedToServer(location))
                .filter(connection -> connection.getShell().isConnected());
    }

    public SshConnection loadConnection(@NonNull UUID id) {
        return connectionDB.loadConnection(id)
                .filter(connection -> connection.getShell().isConnected())
                .orElseThrow(() -> new ProblemException(HttpStatus.NOT_FOUND, STR."Shell with id '\{id.toString()}' does not exist"));
    }

    public boolean deleteShell(@NonNull UUID id) {
        var connection = connectionDB.loadConnection(id)
                .orElseThrow(() -> new ProblemException(HttpStatus.NOT_FOUND, STR."Shell with id '\{id.toString()}' does not exist"));

        connection.getShell().disconnect();
        connection.getSession().disconnect();

        connectionDB.deleteConnection(id);

        return true;
    }

    public Flux<String> loadActiveOutput (UUID id) {
        return loadConnection(id).getOutput();
    }
}
