package com.bahen.jobtracker.skillgap.dto;

import java.util.List;

public record JobRequirements(
        List<String> requiredSkills,
        List<String> niceToHaveSkills,
        SeniorityLevel seniorityLevel,
        EnglishLevel englishLevel
) {

    public JobRequirements {
        requiredSkills = requiredSkills == null
                ? List.of()
                : List.copyOf(requiredSkills);
        niceToHaveSkills = niceToHaveSkills == null
                ? List.of()
                : List.copyOf(niceToHaveSkills);
        seniorityLevel = seniorityLevel == null
                ? SeniorityLevel.NOT_SPECIFIED
                : seniorityLevel;
        englishLevel = englishLevel == null
                ? EnglishLevel.NOT_SPECIFIED
                : englishLevel;
    }
}
