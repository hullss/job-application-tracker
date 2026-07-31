package com.bahen.jobtracker.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSkillRepository
        extends JpaRepository<UserSkill, Long> {

    List<UserSkill> findAllByOwnerOrderByNameAsc(UserAccount owner);

    List<UserSkill> findAllByOwnerEmailIgnoreCaseOrderByNameAsc(
            String email
    );

    boolean existsByOwnerAndNormalizedName(
            UserAccount owner,
            String normalizedName
    );

    Optional<UserSkill> findByIdAndOwner(
            Long id,
            UserAccount owner
    );
}
