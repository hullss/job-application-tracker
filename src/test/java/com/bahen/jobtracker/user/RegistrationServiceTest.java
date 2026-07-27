package com.bahen.jobtracker.user;

import com.bahen.jobtracker.user.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private UserAccountRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private RegistrationService registrationService;

    @BeforeEach
    void setUp() {
        registrationService = new RegistrationService(
                userRepository,
                passwordEncoder
        );
    }

    @Test
    void registerNormalizesEmailAndHashesPassword() {
        RegisterRequest request = new RegisterRequest(
                "  New.User@Example.COM  ",
                "password123"
        );

        when(userRepository.existsByEmailIgnoreCase(
                "new.user@example.com"
        )).thenReturn(false);
        when(passwordEncoder.encode("password123"))
                .thenReturn("encoded-password");
        when(userRepository.saveAndFlush(
                org.mockito.ArgumentMatchers.any(UserAccount.class)
        )).thenAnswer(invocation -> {
            UserAccount user = invocation.getArgument(0);
            user.onCreate();
            return user;
        });

        var response = registrationService.register(request);

        ArgumentCaptor<UserAccount> captor =
                ArgumentCaptor.forClass(UserAccount.class);
        verify(userRepository).saveAndFlush(captor.capture());

        assertEquals(
                "new.user@example.com",
                captor.getValue().getEmail()
        );
        assertEquals(
                "encoded-password",
                captor.getValue().getPasswordHash()
        );
        assertEquals("new.user@example.com", response.email());
        assertNotNull(response.createdAt());
    }

    @Test
    void registerRejectsAnExistingEmail() {
        when(userRepository.existsByEmailIgnoreCase(
                "test@example.com"
        )).thenReturn(true);

        assertThrows(
                EmailAlreadyExistsException.class,
                () -> registrationService.register(
                        new RegisterRequest(
                                "TEST@example.com",
                                "password123"
                        )
                )
        );

        verify(passwordEncoder, never()).encode(
                org.mockito.ArgumentMatchers.anyString()
        );
        verify(userRepository, never()).saveAndFlush(
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void registerTranslatesDatabaseEmailConflict() {
        when(userRepository.existsByEmailIgnoreCase(
                "test@example.com"
        )).thenReturn(false);
        when(passwordEncoder.encode("password123"))
                .thenReturn("encoded-password");
        when(userRepository.saveAndFlush(
                org.mockito.ArgumentMatchers.any(UserAccount.class)
        )).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThrows(
                EmailAlreadyExistsException.class,
                () -> registrationService.register(
                        new RegisterRequest(
                                "test@example.com",
                                "password123"
                        )
                )
        );
    }
}
