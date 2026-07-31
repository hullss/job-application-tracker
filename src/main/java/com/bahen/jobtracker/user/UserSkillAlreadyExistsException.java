package com.bahen.jobtracker.user;

public class UserSkillAlreadyExistsException extends RuntimeException {

    public UserSkillAlreadyExistsException(String name) {
        super("Skill '%s' already exists".formatted(name));
    }
}