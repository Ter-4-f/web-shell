package com.teraf.webshell.controller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.teraf.webshell.config.Config;
import com.teraf.webshell.model.*;
import com.teraf.webshell.utils.LocationUtil;
import org.apache.commons.text.StringEscapeUtils;
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
    public Mono<ResponseEntity<ConnectionDTO>> createShell (@RequestParam("host") String host, @RequestParam("port") int port, @RequestBody(required = false) CommandRequest request) {
        ServerData location = LocationUtil.checkLocation(host, port, this.config.getLocations());
        var command = Optional.ofNullable(request)
                .map(CommandRequest::getCommand)
                .orElse(null);

        return cliBC.executeCommand(command, location)
                .map(SshConnection::toDTO)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/shells/{shell-id}")
    public Mono<ResponseEntity<Void>> executeCommand (@PathVariable(value="shell-id") String shellId, @RequestBody CommandRequest request, @RequestParam(value = "asSignal", required = false) Boolean asSignal) {
        return cliBC.executeCommand(UUID.fromString(shellId), request.getCommand(), Boolean.TRUE.equals(asSignal))
                .map(_ -> ResponseEntity.noContent().build());
    }


    @GetMapping(value = "/shells/{shell-id}/output", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> getShellOutput (@PathVariable(value="shell-id") String shellId) {
        return shellBC.loadActiveOutput(UUID.fromString(shellId))
//                .doOnNext(s -> System.out.println(STR."Data: '\{StringEscapeUtils.escapeJava(s)}'"))
                ;
    }

    @PostMapping(value = "/shells/{shell-id}:cancel")
    public Mono<ResponseEntity<Void>> cancelCommand (@PathVariable(value="shell-id") String shellId) {
        return cliBC.cancelCommand(UUID.fromString(shellId))
                .map(_ -> ResponseEntity.noContent().build());
    }

    @DeleteMapping(value = "/shells/{shell-id}")
    public Mono<ResponseEntity<Void>> deleteShell (@PathVariable(value="shell-id") String shellId) {
        shellBC.deleteShell(UUID.fromString(shellId));
        return Mono.just(ResponseEntity.noContent().build());
    }
}
