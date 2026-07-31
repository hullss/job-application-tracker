package com.bahen.jobtracker.skillgap;

public class JobDescriptionMissingException
        extends RuntimeException {

    public JobDescriptionMissingException(Long applicationId) {
        super(
                "Application with id "
                        + applicationId
                        + " does not contain a job description"
        );
    }
}
