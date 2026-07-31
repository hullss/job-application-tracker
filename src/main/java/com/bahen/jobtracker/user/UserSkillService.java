package com.bahen.jobtracker.user;

import com.bahen.jobtracker.user.dto.CreateUserSkillRequest;
import com.bahen.jobtracker.user.dto.UserSkillResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserSkillService {

    private final UserSkillRepository skillRepository;
    private final UserAccountRepository userRepository;

    public UserSkillService(
            UserSkillRepository skillRepository,
            UserAccountRepository userRepository
    ) {
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserSkillResponse> getSkills(String userEmail) {
        UserAccount owner = findUser(userEmail);

        return skillRepository.findAllByOwnerOrderByNameAsc(owner)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public UserSkillResponse addSkill(
            CreateUserSkillRequest request,
            String userEmail
    ) {
        UserAccount owner = findUser(userEmail);

        String cleanedName =
                SkillNameNormalizer.clean(request.name());
        String normalizedName =
                SkillNameNormalizer.normalize(cleanedName);

        if (skillRepository.existsByOwnerAndNormalizedName(
                owner,
                normalizedName
        )) {
            throw new UserSkillAlreadyExistsException(cleanedName);
        }

        UserSkill skill = new UserSkill(owner, cleanedName);

        try {
            return toResponse(skillRepository.saveAndFlush(skill));
        } catch (DataIntegrityViolationException exception) {
            throw new UserSkillAlreadyExistsException(cleanedName);
        }
    }

    @Transactional
    public void deleteSkill(Long id, String userEmail) {
        UserAccount owner = findUser(userEmail);

        UserSkill skill = skillRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new UserSkillNotFoundException(id));

        skillRepository.delete(skill);
    }

    private UserAccount findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Authenticated user no longer exists"
                ));
    }

    private UserSkillResponse toResponse(UserSkill skill) {
        return new UserSkillResponse(
                skill.getId(),
                skill.getName()
        );
    }
}
