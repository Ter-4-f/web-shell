package com.teraf.webshell.model;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShellDTO {

    String id;
    String cwd;
    List<CommandDTO> commands;
    String createdAt;
    boolean isActive;

}
