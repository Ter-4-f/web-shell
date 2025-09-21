package com.teraf.webshell.model;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommandDTO {

    String command;
    String cwd;
    long pid;
    List<String> output;
    Integer exitCode;
    Long duration;
    String startedAt;

}
