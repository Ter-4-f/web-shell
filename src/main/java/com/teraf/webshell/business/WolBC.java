package com.teraf.webshell.business;

import com.teraf.webshell.dataaccess.WolDAO;
import com.teraf.webshell.model.ProblemException;
import com.teraf.webshell.model.ServerData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

@Slf4j
@Component
@RequiredArgsConstructor
public class WolBC {

    private final WolDAO wolDAO;

    public Mono<Boolean> wakePc (ServerData location) {
        if (location.isVirtual())
            return Mono.error(new ProblemException(HttpStatus.INTERNAL_SERVER_ERROR, "Not yet implemented"));
        else
            return wakeHardware(location);
    }

    public Mono<Boolean> wakeHardware (ServerData location) {
        return Mono.fromCallable(() -> wolDAO.sendWolPackage(location.getIp(), location.getMac()));
    }

}
