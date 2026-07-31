package com.bahen.jobtracker.calendar;

public class ApplicationEventNotFoundException extends RuntimeException {

    public ApplicationEventNotFoundException(Long id) {
        super("Application event with id " + id + " not found");
    }
}