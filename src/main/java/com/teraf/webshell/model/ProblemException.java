package com.teraf.webshell.model;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public class ProblemException extends RuntimeException {

    int code;
    String detail;
    String title;


    public ProblemException(int code, String title, String detail, Throwable cause) {
        super(cause);
        this.code = code;
        this.detail = detail;
        this.title = title;
    }

    public ProblemException(HttpStatus status, String detail, Throwable cause) {
        this(status.value(), status.getReasonPhrase(), detail, cause);
    }
    public ProblemException(HttpStatus status, String detail) {
        this(status, detail, null);
    }


    public ProblemDTO toDTO () {
        return new ProblemDTO(code, detail, title);
    }
}
