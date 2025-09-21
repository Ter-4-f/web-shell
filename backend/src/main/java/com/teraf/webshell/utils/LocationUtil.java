package com.teraf.webshell.utils;

import com.teraf.webshell.model.ProblemException;
import com.teraf.webshell.model.ServerData;
import lombok.experimental.UtilityClass;
import org.springframework.http.HttpStatus;

import java.util.List;

@UtilityClass
public class LocationUtil {

    public static ServerData checkLocation (String host, Integer port, List<ServerData> locations) {
        if (host == null || host.isEmpty()) {
            throw new ProblemException(HttpStatus.BAD_REQUEST, "Required query-parameter 'host' not provided.");
        }
        if (port == null || port <= 0) {
            throw new ProblemException(HttpStatus.BAD_REQUEST, "Required query-parameter 'port' not provided.");
        }

        return locations.stream()
                .filter(data -> host.equalsIgnoreCase(data.getHost()))
                .filter(data -> port == data.getPort())
                .findFirst()
                .orElseThrow(() -> new ProblemException(HttpStatus.BAD_REQUEST, STR."Unknown host '\{ host }'"));
    }
}
