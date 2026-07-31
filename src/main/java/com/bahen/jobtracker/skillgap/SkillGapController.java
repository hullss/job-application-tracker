package com.bahen.jobtracker.skillgap;

import com.bahen.jobtracker.skillgap.dto.SkillGapAnalysisResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(
        name = "AI Skill Gap",
        description = "Analyze job requirements and compare them with user skills"
)
@RestController
@RequestMapping("/api/applications")
public class SkillGapController {

    private final SkillGapService skillGapService;

    public SkillGapController(SkillGapService skillGapService) {
        this.skillGapService = skillGapService;
    }

    @Operation(summary = "Analyze an application with AI")
    @PostMapping("/{id}/skill-gap")
    public SkillGapAnalysisResponse analyze(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return skillGapService.analyze(
                id,
                authentication.getName()
        );
    }
}