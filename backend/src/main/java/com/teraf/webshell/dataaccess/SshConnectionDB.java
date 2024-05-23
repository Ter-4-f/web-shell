package com.teraf.webshell.dataaccess;

import com.teraf.webshell.model.SshConnection;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SshConnectionDB {

    private static final Map<UUID, SshConnection> cache = new ConcurrentHashMap<>();


    public Optional<SshConnection> loadConnection (UUID id) {
        return Optional.ofNullable(cache.get(id));
    }

    public Flux<SshConnection> loadConnections () {
        return Flux.fromIterable(cache.values());
    }

    public void saveConnection (SshConnection connection) {
        cache.put(connection.getId(), connection);
    }


    public void deleteConnection (UUID id) {
        cache.remove(id);
    }

}
