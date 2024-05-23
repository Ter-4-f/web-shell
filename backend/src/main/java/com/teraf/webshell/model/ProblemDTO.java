package com.teraf.webshell.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProblemDTO {

    int code;
    String detail;
    String title;

}
