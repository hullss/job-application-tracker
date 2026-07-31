package com.bahen.jobtracker.skillgap.analyzer;

import com.bahen.jobtracker.skillgap.dto.JobRequirements;

public interface JobDescriptionAnalyzer {

    JobRequirements analyze(String jobDescription);
}
