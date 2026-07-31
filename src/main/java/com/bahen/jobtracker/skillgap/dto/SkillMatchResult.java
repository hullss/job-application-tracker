package com.bahen.jobtracker.skillgap.dto;

import java.util.List;

public record SkillMatchResult(
        int matchPercentage,
        List<String> matchedSkills,
        List<String> missingSkills,
        List<String> matchedNiceToHaveSkills
) {
}