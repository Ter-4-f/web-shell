package com.teraf.webshell.dataaccess;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.teraf.webshell.model.Shell;
import reactor.core.publisher.Flux;

@Component
public class ShellDAO {

    private static final Map<UUID, Shell> cache = new ConcurrentHashMap<>();


    public Optional<Shell> loadShell (UUID id) {
        return Optional.ofNullable(cache.get(id));
    }

    public Flux<Shell> loadShells () {
        return Flux.fromIterable(cache.values());
    }

    public void saveShell (Shell shell) {
        cache.put(shell.getId(), shell);
    }

}
