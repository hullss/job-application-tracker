package com.bahen.jobtracker.user;

import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

public final class SkillNameNormalizer {

    private static final Pattern MULTIPLE_WHITESPACE =
            Pattern.compile("\\s+");
    private static final Pattern TRAILING_SEPARATORS =
            Pattern.compile("[\\s.,;:!?_\\-]+$");

    private SkillNameNormalizer() {
    }

    public static String clean(String skillName) {
        String cleaned = Objects.requireNonNull(skillName).strip();

        cleaned = MULTIPLE_WHITESPACE
                .matcher(cleaned)
                .replaceAll(" ");
        cleaned = TRAILING_SEPARATORS
                .matcher(cleaned)
                .replaceAll("");

        if (cleaned.isBlank()) {
            throw new IllegalArgumentException(
                    "Skill name must contain letters or numbers"
            );
        }

        return cleaned;
    }

    public static String normalize(String skillName) {
        return clean(skillName).toLowerCase(Locale.ROOT);
    }
}
