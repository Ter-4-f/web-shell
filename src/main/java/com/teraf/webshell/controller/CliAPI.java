package com.teraf.webshell.controller;

import java.util.List;
import java.util.UUID;

import com.teraf.webshell.config.Config;
import com.teraf.webshell.model.*;
import com.teraf.webshell.utils.LocationUtil;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.teraf.webshell.business.CliBC;
import com.teraf.webshell.business.ShellBC;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Profile("cli")
@RestController
@RequiredArgsConstructor
public class CliAPI {

    private final CliBC cliBC;
    private final ShellBC shellBC;
    private final Config config;


    @GetMapping("/shells")
    public Mono<ResponseEntity<List<ConnectionDTO>>> getShells (@RequestParam("host") String host, @RequestParam("port") int port) {
        ServerData location = LocationUtil.checkLocation(host, port, this.config.getLocations());

        return shellBC.loadShells(location)
                .map(SshConnection::toDTO)
                .collectList()
                .map(ResponseEntity::ok);
    }

    @PostMapping("/shells")
    public Mono<ResponseEntity<ConnectionDTO>> createShell (@RequestParam("host") String host, @RequestParam("port") int port, @RequestBody CommandRequest request) {
        ServerData location = LocationUtil.checkLocation(host, port, this.config.getLocations());

        return cliBC.executeCommand(request.getCommand(), location)
                .map(SshConnection::toDTO)
                .map(ResponseEntity::ok);
    }


    @GetMapping(value = "/shells/{shell-id}/output", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> getShellOutput (@PathVariable(value="shell-id") String shellId) {
        return shellBC.loadActiveOutput(UUID.fromString(shellId));
    }

    @PostMapping(value = "/shells/{shell-id}:cancel")
    public Mono<ResponseEntity<Void>> cancelCommand (@PathVariable(value="shell-id") String shellId) {
        return shellBC.cancelCommand(UUID.fromString(shellId))
                .map(_ -> ResponseEntity.noContent().build());
    }
}
