package com.teraf.webshell.model;

import com.jcraft.jsch.ChannelShell;
import com.jcraft.jsch.Session;
import lombok.*;
import reactor.core.publisher.Flux;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class SshConnection {

    UUID id;
    Session session;
    ChannelShell shell;
    LocalDateTime createdAt;
    @Setter Flux<String> output;


    public boolean isConnectedToServer (ServerData server) {
        return session.getHost().equalsIgnoreCase(server.getHost()) && session.getPort() == server.getPort();
    }

    public ConnectionDTO toDTO () {
        return ConnectionDTO.builder()
                .id(id.toString())
                .createdAt(createdAt.format(DateTimeFormatter.ISO_DATE_TIME))
                .build();
    }

}
