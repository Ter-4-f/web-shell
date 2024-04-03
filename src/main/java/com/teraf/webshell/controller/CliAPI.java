package com.teraf.webshell.controller;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import com.teraf.webshell.model.*;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

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


    @GetMapping("/shells")
    public Mono<ResponseEntity<List<ShellDTO>>> getShells () {
        return shellBC.loadShells()
                .map(Shell::toDetailDTO)
                .collectList()
                .map(ResponseEntity::ok);
    }

    @PostMapping("/shells")
    public Mono<ResponseEntity<ShellDTO>> createShell (@RequestBody CommandRequest request) {
        return cliBC.executeCommand(request.getCommand())
                .map(Shell::toDetailDTO)
                .map(ResponseEntity::ok);
    }

    
    @GetMapping(value = "/shells/{shell-id}")
    public Mono<ResponseEntity<ShellDTO>> getShellDetail (@PathVariable(value="shell-id") String shellId) {
        return Mono.fromCallable(() -> shellBC.loadShell(UUID.fromString(shellId)))
                .map(Shell::toDetailDTO)
                .map(ResponseEntity::ok);
    }


    @GetMapping(value = "/shells/{shell-id}/active-command/output", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> getShellOutput (@PathVariable(value="shell-id") String shellId) {
        return shellBC.loadActiveOutput(UUID.fromString(shellId));
    }

    @PostMapping(value = "/shells/{shell-id}/active-command:cancel")
    public Mono<ResponseEntity<CommandDTO>> cancelCommand (@PathVariable(value="shell-id") String shellId) {
        return shellBC.cancelCommand(UUID.fromString(shellId))
                .map(Command::toDTO)
                .map(ResponseEntity::ok);
    }

}
