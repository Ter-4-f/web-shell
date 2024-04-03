package com.teraf.webshell.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.teraf.webshell.model.ProblemDTO;
import com.teraf.webshell.model.ProblemException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class ErrorHandler {

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ProblemDTO serverExceptionHandler(Exception ex) {
        log.error("Unexpected error: ", ex);
        return new ProblemDTO(500, "An unexpected error occured", "INTERNAL_SERVER_ERROR");
    }


    
    @ExceptionHandler(ProblemException.class)
    public ProblemDTO serverExceptionHandler(ProblemException ex) {
        var dto = ex.toDTO();
        if (dto.getCode() >= 500)
            log.error("Experienced a fatal error", ex);
        else 
            log.warn("Experienced user error", ex);
        
        return dto;
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDTO serverExceptionHandler(NoResourceFoundException ex) {
        return new ProblemDTO(404, "Path does not exit", "NOT_FOUND");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDTO serverExceptionHandler(IllegalArgumentException ex) {
        return new ProblemDTO(400, ex.getMessage(), "BAD_REQUEST");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDTO serverExceptionHandler(HttpRequestMethodNotSupportedException ex) {
        return new ProblemDTO(405, ex.getMessage(), "METHODE_NOT_FOUND");
    }

}
