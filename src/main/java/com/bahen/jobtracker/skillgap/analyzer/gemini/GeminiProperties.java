package com.bahen.jobtracker.skillgap.analyzer.gemini;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;
import java.time.Duration;

@ConfigurationProperties(prefix = "app.ai.gemini")
public record GeminiProperties(
        String apiKey,
        String model,
        URI baseUrl,
        Duration timeout
) {
}