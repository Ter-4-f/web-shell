package com.teraf.webshell.controller;

import com.teraf.webshell.business.CliBC;
import com.teraf.webshell.business.ShellBC;
import com.teraf.webshell.config.Config;
import com.teraf.webshell.model.*;
import com.teraf.webshell.utils.LocationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Profile("remote-hosts")
@RestController
@RequiredArgsConstructor
public class HostAPI {

    private final CliBC cliBC;
    private final ShellBC shellBC;
    private final Config config;



    @PostMapping("/ping")
    public Mono<ResponseEntity<PingResponseDTO>> checkIp (@RequestBody(required = false) PingRequest request) {
        return Mono.fromCallable(() -> InetAddress
                        .getByName(request.getHost())
                        .isReachable(5000)
                )
                .onErrorResume(UnknownHostException.class, _ -> Mono.just(false))
                .map(PingResponseDTO::new)
                .map(ResponseEntity::ok)
                .onErrorMap(UnknownHostException.class, _ -> new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Unreachable host: " + request.getHost()));
    }

    @GetMapping("/hosts")
    public Mono<ResponseEntity<String>> shutdownHost (@RequestParam("host") String host, @RequestParam("port") int port) {
        ServerData location = LocationUtil.checkLocation(host, port, this.config.getLocations());

        return cliBC.killPc(location)
                .map(ResponseEntity::ok);
    }
}
