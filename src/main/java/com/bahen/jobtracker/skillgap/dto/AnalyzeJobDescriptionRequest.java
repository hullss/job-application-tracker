package com.bahen.jobtracker.skillgap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnalyzeJobDescriptionRequest(

        @NotBlank(message = "Job description is required")
        @Size(
                min = 20,
                max = 20_000,
                message = "Job description must contain between 20 and 20000 characters"
        )
        String jobDescription
) {
}