package com.bahen.jobtracker.auth;

import com.bahen.jobtracker.auth.dto.AuthResponse;
import com.bahen.jobtracker.auth.dto.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private Authentication authentication;

    private LoginService loginService;

    @BeforeEach
    void setUp() {
        loginService = new LoginService(
                authenticationManager,
                jwtService
        );
    }

    @Test
    void loginNormalizesEmailAndReturnsJwt() {
        AuthResponse expected = new AuthResponse(
                "signed-token",
                "Bearer",
                86_400
        );

        when(authenticationManager.authenticate(
                org.mockito.ArgumentMatchers.any(Authentication.class)
        )).thenReturn(authentication);
        when(jwtService.createToken(authentication)).thenReturn(expected);

        AuthResponse actual = loginService.login(
                new LoginRequest(
                        "  TEST@Example.COM  ",
                        "password123"
                )
        );

        ArgumentCaptor<Authentication> captor =
                ArgumentCaptor.forClass(Authentication.class);
        verify(authenticationManager).authenticate(captor.capture());

        assertEquals("test@example.com", captor.getValue().getName());
        assertEquals("password123", captor.getValue().getCredentials());
        assertEquals(expected, actual);
    }
}
