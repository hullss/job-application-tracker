package com.bahen.jobtracker.skillgap.dto;

public record SkillGapAnalysisResponse(
        JobRequirements requirements,
        SkillMatchResult match
) {
}