package com.bahen.jobtracker.auth;

import com.bahen.jobtracker.auth.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final Duration expiration;

    public JwtService(
            JwtEncoder jwtEncoder,
            @Value("${app.jwt.expiration}") Duration expiration
    ) {
        this.jwtEncoder = jwtEncoder;
        this.expiration = expiration;
    }

    public AuthResponse createToken(Authentication authentication) {
        Instant issuedAt = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("job-application-tracker")
                .subject(authentication.getName())
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plus(expiration))
                .claim("scope", "USER")
                .build();

        String token = jwtEncoder.encode(
                JwtEncoderParameters.from(claims)
        ).getTokenValue();

        return new AuthResponse(
                token,
                "Bearer",
                expiration.toSeconds()
        );
    }
}