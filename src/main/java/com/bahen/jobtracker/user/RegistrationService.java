package com.bahen.jobtracker.user;

import com.bahen.jobtracker.user.dto.RegisterRequest;
import com.bahen.jobtracker.user.dto.UserResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class RegistrationService {

    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(
            UserAccountRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        UserAccount user = new UserAccount(
                email,
                passwordEncoder.encode(request.password())
        );

        try {
            UserAccount savedUser = userRepository.saveAndFlush(user);

            return new UserResponse(
                    savedUser.getId(),
                    savedUser.getEmail(),
                    savedUser.getCreatedAt()
            );
        } catch (DataIntegrityViolationException exception) {
            throw new EmailAlreadyExistsException(email);
        }
    }
}