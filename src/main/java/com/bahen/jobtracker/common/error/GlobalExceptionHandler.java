package com.bahen.jobtracker.common.error;

import com.bahen.jobtracker.application.ApplicationNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import com.bahen.jobtracker.user.EmailAlreadyExistsException;
import org.springframework.security.core.AuthenticationException;
import com.bahen.jobtracker.user.UserSkillAlreadyExistsException;
import com.bahen.jobtracker.user.UserSkillNotFoundException;
import com.bahen.jobtracker.skillgap.JobDescriptionMissingException;
import com.bahen.jobtracker.skillgap.analyzer.AiAnalysisException;
import com.bahen.jobtracker.calendar.ApplicationEventNotFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApplicationNotFoundException.class)
    public ProblemDetail handleApplicationNotFound(
            ApplicationNotFoundException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                exception.getMessage()
        );

        problem.setTitle("Application not found");

        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleBodyValidation(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> errors = new LinkedHashMap<>();

        exception.getBindingResult().getFieldErrors().forEach(error ->
                errors.putIfAbsent(
                        error.getField(),
                        error.getDefaultMessage()
                )
        );

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Request validation failed"
        );

        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);

        return problem;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleParameterValidation(
            ConstraintViolationException exception
    ) {
        Map<String, String> errors = new LinkedHashMap<>();

        exception.getConstraintViolations().forEach(violation ->
                errors.put(
                        violation.getPropertyPath().toString(),
                        violation.getMessage()
                )
        );

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Request parameter validation failed"
        );

        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);

        return problem;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(
            MethodArgumentTypeMismatchException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Invalid value '%s' for parameter '%s'"
                        .formatted(exception.getValue(), exception.getName())
        );

        problem.setTitle("Invalid request parameter");

        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadableJson() {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Request body contains invalid JSON or an unsupported value"
        );

        problem.setTitle("Invalid request body");

        return problem;
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ProblemDetail handleEmailAlreadyExists(
            EmailAlreadyExistsException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );

        problem.setTitle("Email already exists");

        return problem;
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthenticationFailure() {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
        );

        problem.setTitle("Authentication failed");

        return problem;
    }

    @ExceptionHandler(UserSkillAlreadyExistsException.class)
    public ProblemDetail handleSkillAlreadyExists(
            UserSkillAlreadyExistsException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );

        problem.setTitle("Skill already exists");

        return problem;
    }

    @ExceptionHandler(UserSkillNotFoundException.class)
    public ProblemDetail handleSkillNotFound(
            UserSkillNotFoundException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                exception.getMessage()
        );

        problem.setTitle("Skill not found");

        return problem;
    }

    @ExceptionHandler(JobDescriptionMissingException.class)
    public ProblemDetail handleMissingJobDescription(
            JobDescriptionMissingException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                exception.getMessage()
        );

        problem.setTitle("Job description is missing");

        return problem;
    }

    @ExceptionHandler(AiAnalysisException.class)
    public ProblemDetail handleAiAnalysisFailure(
            AiAnalysisException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.SERVICE_UNAVAILABLE,
                exception.getMessage()
        );

        problem.setTitle("AI analysis unavailable");

        return problem;
    }

    @ExceptionHandler(ApplicationEventNotFoundException.class)
    public ProblemDetail handleApplicationEventNotFound(
            ApplicationEventNotFoundException exception
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                exception.getMessage()
        );

        problem.setTitle("Calendar event not found");

        return problem;
    }
}