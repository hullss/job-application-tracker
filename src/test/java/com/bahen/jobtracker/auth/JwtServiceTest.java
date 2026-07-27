package com.bahen.jobtracker.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock
    private JwtEncoder jwtEncoder;

    @Mock
    private Authentication authentication;

    @Mock
    private Jwt jwt;

    @Test
    void createTokenUsesExpectedClaimsAndExpiration() {
        when(authentication.getName()).thenReturn("test@example.com");
        when(jwtEncoder.encode(
                org.mockito.ArgumentMatchers.any(
                        JwtEncoderParameters.class
                )
        )).thenReturn(jwt);
        when(jwt.getTokenValue()).thenReturn("signed-token");

        JwtService jwtService = new JwtService(
                jwtEncoder,
                Duration.ofHours(24)
        );

        var response = jwtService.createToken(authentication);

        ArgumentCaptor<JwtEncoderParameters> captor =
                ArgumentCaptor.forClass(JwtEncoderParameters.class);
        verify(jwtEncoder).encode(captor.capture());

        var claims = captor.getValue().getClaims();

        assertEquals("signed-token", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(86_400, response.expiresIn());
        assertEquals(
                "job-application-tracker",
                claims.getClaimAsString("iss")
        );
        assertEquals("test@example.com", claims.getSubject());
        assertEquals("USER", claims.getClaim("scope"));
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiresAt());
        assertEquals(
                24,
                ChronoUnit.HOURS.between(
                        claims.getIssuedAt(),
                        claims.getExpiresAt()
                )
        );
    }
}
