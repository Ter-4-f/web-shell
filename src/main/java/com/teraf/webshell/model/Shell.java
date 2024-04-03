package com.teraf.webshell.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.Getter;

@Getter
public class Shell {

    UUID id;
    String cwd;
    List<Command> commands;
    LocalDateTime createdAt;

    
    public Shell(Command command) {
        this.cwd = command.getCwd();
        this.id = UUID.randomUUID();
        this.commands = new ArrayList<>(List.of(command));
        this.createdAt = LocalDateTime.now();
    }

    public Shell(String cwd) {
        this.cwd = cwd;
        this.id = UUID.randomUUID();
        this.commands = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
    }

    public Command getNewestCommand () {
        return this.commands.get(this.commands.size() -1);
    }

    public void addCommand (Command command) {
        this.commands.add(command);
    }

    public boolean isActive () {
        return this.commands.get(this.commands.size() - 1)
                .getExitCode()
                .isEmpty();
    }


    public ShellDTO toDetailDTO () {
        var commandDTOs = commands.stream().map(Command::toDTO).collect(Collectors.toList());
        return ShellDTO.builder()
                .id(id.toString())
                .cwd(cwd)
                .createdAt(createdAt.format(DateTimeFormatter.ISO_DATE_TIME))
                .commands(commandDTOs)
                .isActive(!commands.isEmpty() && commandDTOs.get(commandDTOs.size() - 1).exitCode == null)
                .build();
    }

    public ShellDTO toDTO () {
        return ShellDTO.builder()
                .id(id.toString())
                .cwd(cwd)
                .createdAt(createdAt.format(DateTimeFormatter.ISO_DATE_TIME))
                .isActive(commands.get(commands.size() -1).getExitCode().isEmpty())
                .build();
    }

    
}
