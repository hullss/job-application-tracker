package com.bahen.jobtracker.skillgap;

import com.bahen.jobtracker.skillgap.dto.EnglishLevel;
import com.bahen.jobtracker.skillgap.dto.JobRequirements;
import com.bahen.jobtracker.skillgap.dto.SeniorityLevel;
import com.bahen.jobtracker.skillgap.dto.SkillMatchResult;
import com.bahen.jobtracker.user.UserAccount;
import com.bahen.jobtracker.user.UserSkill;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SkillMatchCalculatorTest {

    private final SkillMatchCalculator calculator =
            new SkillMatchCalculator();

    @Test
    void calculatesSkillMatch() {
        UserAccount user = new UserAccount(
                "test@example.com",
                "password-hash"
        );

        List<UserSkill> userSkills = List.of(
                new UserSkill(user, "java"),
                new UserSkill(user, "PostgreSQL"),
                new UserSkill(user, "Git")
        );

        JobRequirements requirements = new JobRequirements(
                List.of("Java", "Docker", "PostgreSQL"),
                List.of("AWS", "Git"),
                SeniorityLevel.JUNIOR,
                EnglishLevel.B1
        );

        SkillMatchResult result = calculator.calculate(
                requirements,
                userSkills
        );

        assertThat(result.matchPercentage()).isEqualTo(67);
        assertThat(result.matchedSkills())
                .containsExactly("Java", "PostgreSQL");
        assertThat(result.missingSkills())
                .containsExactly("Docker");
        assertThat(result.matchedNiceToHaveSkills())
                .containsExactly("Git");
    }

    @Test
    void ignoresTrailingPunctuationInUserSkills() {
        UserAccount user = new UserAccount(
                "test@example.com",
                "password-hash"
        );

        JobRequirements requirements = new JobRequirements(
                List.of("Spring Boot"),
                List.of(),
                SeniorityLevel.JUNIOR,
                EnglishLevel.B1
        );

        SkillMatchResult result = calculator.calculate(
                requirements,
                List.of(new UserSkill(user, "Spring Boot."))
        );

        assertThat(result.matchPercentage()).isEqualTo(100);
        assertThat(result.matchedSkills())
                .containsExactly("Spring Boot");
        assertThat(result.missingSkills()).isEmpty();
    }
}
