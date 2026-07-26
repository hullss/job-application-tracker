package com.bahen.jobtracker.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {
    @Query("""
        SELECT a FROM Application a
        WHERE (:status IS NULL OR a.currentStatus = :status)
          AND (
              LOWER(a.company) LIKE CONCAT('%', :search, '%')
              OR LOWER(a.position) LIKE CONCAT('%', :search, '%')
          )
        """)
    Page<Application> findAllFiltered(
            @Param("search") String search,
            @Param("status") ApplicationStatus status,
            Pageable pageable
    );
}
