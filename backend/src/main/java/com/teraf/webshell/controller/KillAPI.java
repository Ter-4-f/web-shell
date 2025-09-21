package com.teraf.webshell.controller;

import com.teraf.webshell.business.CliBC;
import com.teraf.webshell.config.Config;
import com.teraf.webshell.model.*;
import com.teraf.webshell.utils.LocationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Profile("kill-server")
@RestController
@RequiredArgsConstructor
public class KillAPI {

    private final CliBC cliBC;
    private final Config config;


    @PostMapping("/kill")
    public Mono<ResponseEntity<SingleCommandResponse>> shutdownPC (@RequestParam("host") String host, @RequestParam("port") int port) {
        ServerData location = LocationUtil.checkLocation(host, port, this.config.getLocations());
        return cliBC.killPc(location)
                .map(SingleCommandResponse::new)
                .map(ResponseEntity::ok);
    }

}
