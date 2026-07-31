package com.bahen.jobtracker.skillgap;

import com.bahen.jobtracker.application.Application;
import com.bahen.jobtracker.application.ApplicationNotFoundException;
import com.bahen.jobtracker.application.ApplicationRepository;
import com.bahen.jobtracker.skillgap.analyzer.JobDescriptionAnalyzer;
import com.bahen.jobtracker.skillgap.dto.JobRequirements;
import com.bahen.jobtracker.skillgap.dto.SkillGapAnalysisResponse;
import com.bahen.jobtracker.skillgap.dto.SkillMatchResult;
import com.bahen.jobtracker.user.UserSkill;
import com.bahen.jobtracker.user.UserSkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillGapService {

    private final JobDescriptionAnalyzer analyzer;
    private final SkillMatchCalculator calculator;
    private final ApplicationRepository applicationRepository;
    private final UserSkillRepository skillRepository;

    public SkillGapService(
            JobDescriptionAnalyzer analyzer,
            SkillMatchCalculator calculator,
            ApplicationRepository applicationRepository,
            UserSkillRepository skillRepository
    ) {
        this.analyzer = analyzer;
        this.calculator = calculator;
        this.applicationRepository = applicationRepository;
        this.skillRepository = skillRepository;
    }

    public SkillGapAnalysisResponse analyze(
            Long applicationId,
            String userEmail
    ) {
        Application application = applicationRepository
                .findByIdAndOwnerEmailIgnoreCase(
                        applicationId,
                        userEmail
                )
                .orElseThrow(() ->
                        new ApplicationNotFoundException(applicationId)
                );

        String jobDescription = application.getJobDescription();

        if (jobDescription == null || jobDescription.isBlank()) {
            throw new JobDescriptionMissingException(applicationId);
        }

        List<UserSkill> userSkills = skillRepository
                .findAllByOwnerEmailIgnoreCaseOrderByNameAsc(
                        userEmail
                );

        JobRequirements requirements =
                analyzer.analyze(jobDescription.strip());

        SkillMatchResult match =
                calculator.calculate(requirements, userSkills);

        return new SkillGapAnalysisResponse(
                requirements,
                match
        );
    }
}