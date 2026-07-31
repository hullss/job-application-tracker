package com.bahen.jobtracker.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ApplicationEventRepository
        extends JpaRepository<ApplicationEvent, Long> {

    @Query("""
            SELECT event
            FROM ApplicationEvent event
            JOIN FETCH event.application application
            JOIN application.owner owner
            WHERE LOWER(owner.email) = LOWER(:userEmail)
              AND event.scheduledAt >= :from
              AND event.scheduledAt < :to
            ORDER BY event.scheduledAt ASC
            """)
    List<ApplicationEvent> findAllForUserBetween(
            @Param("userEmail") String userEmail,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT event
            FROM ApplicationEvent event
            JOIN FETCH event.application application
            JOIN application.owner owner
            WHERE event.id = :eventId
              AND LOWER(owner.email) = LOWER(:userEmail)
            """)
    Optional<ApplicationEvent> findOwnedById(
            @Param("eventId") Long eventId,
            @Param("userEmail") String userEmail
    );

    @Query("""
            SELECT event
            FROM ApplicationEvent event
            JOIN event.application application
            JOIN application.owner owner
            WHERE LOWER(owner.email) = LOWER(:userEmail)
              AND event.type = :type
            """)
    List<ApplicationEvent> findAllForUserByType(
            @Param("userEmail") String userEmail,
            @Param("type") ApplicationEventType type
    );
}