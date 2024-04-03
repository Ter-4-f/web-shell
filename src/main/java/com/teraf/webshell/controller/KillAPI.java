package com.teraf.webshell.controller;

import com.teraf.webshell.business.CliBC;
import com.teraf.webshell.business.ShellBC;
import com.teraf.webshell.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Profile("kill-server")
@RestController
@RequiredArgsConstructor
public class KillAPI {

    private final CliBC cliBC;


    @PostMapping("/kill")
    public Mono<ResponseEntity<CommandDTO>> shutdownPC () {
        return cliBC.killPc()
                .map(command -> command.toDTO(true))
                .map(ResponseEntity::ok);
    }

}
