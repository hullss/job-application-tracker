package com.bahen.jobtracker.user;

public class UserSkillNotFoundException extends RuntimeException {

    public UserSkillNotFoundException(Long id) {
        super("Skill with id %d was not found".formatted(id));
    }
}