package com.bahen.jobtracker.application;

public class ApplicationNotFoundException extends RuntimeException {

    public ApplicationNotFoundException(Long id) {
        super("Application with id " + id + " not found");
    }
}