package com.bahen.jobtracker.auth;

import com.bahen.jobtracker.user.RegistrationService;
import com.bahen.jobtracker.user.dto.RegisterRequest;
import com.bahen.jobtracker.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.bahen.jobtracker.auth.dto.AuthResponse;
import com.bahen.jobtracker.auth.dto.LoginRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistrationService registrationService;
    private final LoginService loginService;

    public AuthController(
            RegistrationService registrationService,
            LoginService loginService
    ) {
        this.registrationService = registrationService;
        this.loginService = loginService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return registrationService.register(request);
    }
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return loginService.login(request);
    }
}
