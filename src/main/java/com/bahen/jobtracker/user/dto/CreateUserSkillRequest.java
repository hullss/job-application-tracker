package com.bahen.jobtracker.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserSkillRequest(

        @NotBlank(message = "Skill name is required")
        @Pattern(
                regexp = ".*[\\p{L}\\p{N}+#].*",
                message = "Skill name must contain letters or numbers"
        )
        @Size(max = 100, message = "Skill name must not exceed 100 characters")
        String name

) {
}
