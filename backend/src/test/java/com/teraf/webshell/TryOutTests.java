package com.teraf.webshell;

import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

public class TryOutTests {

    @Test
    public void TestDelay () throws InterruptedException {
        Flux<Integer> flux = Flux.just(1, 2, 3, 4, 5).delayElements(Duration.ofSeconds(2));

        flux
                .timeout(Duration.ofSeconds(1))
                .onErrorResume(e -> Mono.empty())
                .subscribe(
                        value -> System.out.println("Received: " + value),
                        error -> System.err.println("Error: " + error),
                        () -> System.out.println("Completed")
                );

        Thread.sleep(Duration.ofSeconds(5));
    }
}
