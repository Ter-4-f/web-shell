package com.teraf.webshell.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerData {

    private String mac;
    private String host;
    private int port;
    private String username;
    private String password;

}
