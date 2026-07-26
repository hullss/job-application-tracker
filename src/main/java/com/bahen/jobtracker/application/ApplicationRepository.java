package com.bahen.jobtracker.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    Optional<Application> findByIdAndOwnerEmailIgnoreCase(
            Long id,
            String email
    );

    @Query("""
        SELECT a FROM Application a
        WHERE LOWER(a.owner.email) = LOWER(:email)
          AND (:status IS NULL OR a.currentStatus = :status)
          AND (
              LOWER(a.company) LIKE CONCAT('%', :search, '%')
              OR LOWER(a.position) LIKE CONCAT('%', :search, '%')
          )
        """)
    Page<Application> findAllFiltered(
            @Param("email") String email,
            @Param("search") String search,
            @Param("status") ApplicationStatus status,
            Pageable pageable
    );
}
