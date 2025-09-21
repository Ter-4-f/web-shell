FROM openjdk:21
ADD target/web-shell-0.0.1-SNAPSHOT.jar docker-spring.jar
EXPOSE 8080
ENTRYPOINT ["java", "--enable-preview", "-jar", "docker-spring.jar"]
