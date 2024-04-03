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



    public static ProblemException create (HttpStatus status, String detail, Throwable cause) {
        return new ProblemException(status.value(), status.getReasonPhrase(), detail, cause);

    }

    public ProblemDTO toDTO () {
        return new ProblemDTO(code, detail, title);
    }
}
