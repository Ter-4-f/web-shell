package com.teraf.webshell.controller;

import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
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
    public ResponseEntity<ProblemDTO> serverExceptionHandler(ProblemException ex) {
        var dto = ex.toDTO();
        if (dto.getCode() >= 500)
            log.error("Experienced a fatal error", ex);
        else 
            log.warn("Experienced user error", ex);
        
        return ResponseEntity.status(ex.getCode()).body(dto);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDTO serverExceptionHandler(NoResourceFoundException ex) {
        return new ProblemDTO(404, STR."Path does not exist: '\{ex.getHttpMethod()} \{ex.getResourcePath()}'", "NOT_FOUND");
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            HttpMediaTypeNotSupportedException.class,
            IllegalArgumentException.class
    })
    public ProblemDTO badRequests(Exception ex) {
        return new ProblemDTO(400, ex.getMessage(), "BAD_REQUEST");
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDTO serverExceptionHandler(HttpRequestMethodNotSupportedException ex) {
        return new ProblemDTO(405, ex.getMessage(), "METHODE_NOT_FOUND");
    }

}
