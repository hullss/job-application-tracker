package com.bahen.jobtracker.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    @Test
    void allowsPatchRequestsFromTheFrontend() {
        SecurityConfig securityConfig = new SecurityConfig();
        var source = securityConfig.corsConfigurationSource(
                "https://hulls-job-tracker.web.app"
        );
        var request = new MockHttpServletRequest(
                "PATCH",
                "/api/events/1/complete"
        );

        CorsConfiguration configuration =
                source.getCorsConfiguration(request);

        assertThat(configuration).isNotNull();
        assertThat(configuration.getAllowedMethods())
                .contains("PATCH");
    }
}
