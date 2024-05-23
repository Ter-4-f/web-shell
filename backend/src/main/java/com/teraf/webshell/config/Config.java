package com.teraf.webshell.config;

import com.teraf.webshell.model.ServerData;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.util.List;

@Data
@Configuration
@NoArgsConstructor
@AllArgsConstructor
@ConfigurationProperties("application")
public class Config {

    String startDir;
    String killCommand;
    Duration waitForFirstOutputLine;
    List<ServerData> locations;

}
