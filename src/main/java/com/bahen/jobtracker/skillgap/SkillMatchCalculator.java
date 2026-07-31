package com.bahen.jobtracker.skillgap;

import com.bahen.jobtracker.skillgap.dto.JobRequirements;
import com.bahen.jobtracker.skillgap.dto.SkillMatchResult;
import com.bahen.jobtracker.user.SkillNameNormalizer;
import com.bahen.jobtracker.user.UserSkill;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SkillMatchCalculator {

    public SkillMatchResult calculate(
            JobRequirements requirements,
            List<UserSkill> userSkills
    ) {
        Set<String> userSkillNames = userSkills.stream()
                .map(UserSkill::getName)
                .map(SkillNameNormalizer::normalize)
                .collect(Collectors.toSet());

        List<String> matchedSkills = requirements.requiredSkills().stream()
                .filter(skill -> userSkillNames.contains(normalize(skill)))
                .toList();

        List<String> missingSkills = requirements.requiredSkills().stream()
                .filter(skill -> !userSkillNames.contains(normalize(skill)))
                .toList();

        List<String> matchedNiceToHaveSkills =
                requirements.niceToHaveSkills().stream()
                        .filter(skill ->
                                userSkillNames.contains(normalize(skill))
                        )
                        .toList();

        int matchPercentage = requirements.requiredSkills().isEmpty()
                ? 0
                : (int) Math.round(
                matchedSkills.size() * 100.0
                / requirements.requiredSkills().size()
        );

        return new SkillMatchResult(
                matchPercentage,
                matchedSkills,
                missingSkills,
                matchedNiceToHaveSkills
        );
    }

    private String normalize(String skill) {
        return SkillNameNormalizer.normalize(skill);
    }
}
