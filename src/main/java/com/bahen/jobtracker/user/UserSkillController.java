package com.bahen.jobtracker.user;

import com.bahen.jobtracker.user.dto.CreateUserSkillRequest;
import com.bahen.jobtracker.user.dto.UserSkillResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(
        name = "Profile skills",
        description = "Manage the current user's skills"
)
@RestController
@RequestMapping("/api/profile/skills")
public class UserSkillController {

    private final UserSkillService skillService;

    public UserSkillController(UserSkillService skillService) {
        this.skillService = skillService;
    }

    @Operation(summary = "Get current user's skills")
    @GetMapping
    public List<UserSkillResponse> getSkills(
            Authentication authentication
    ) {
        return skillService.getSkills(authentication.getName());
    }

    @Operation(summary = "Add a skill")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSkillResponse addSkill(
            @Valid @RequestBody CreateUserSkillRequest request,
            Authentication authentication
    ) {
        return skillService.addSkill(
                request,
                authentication.getName()
        );
    }

    @Operation(summary = "Delete a skill")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSkill(
            @PathVariable Long id,
            Authentication authentication
    ) {
        skillService.deleteSkill(
                id,
                authentication.getName()
        );
    }
}