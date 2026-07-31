package com.bahen.jobtracker.calendar;

import com.bahen.jobtracker.application.Application;
import com.bahen.jobtracker.application.ApplicationNotFoundException;
import com.bahen.jobtracker.application.ApplicationRepository;
import com.bahen.jobtracker.calendar.dto.ApplicationEventResponse;
import com.bahen.jobtracker.calendar.dto.SaveApplicationEventRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ApplicationEventService {

    private final ApplicationEventRepository eventRepository;
    private final ApplicationRepository applicationRepository;

    public ApplicationEventService(
            ApplicationEventRepository eventRepository,
            ApplicationRepository applicationRepository
    ) {
        this.eventRepository = eventRepository;
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public List<ApplicationEventResponse> getEvents(
            Instant from,
            Instant to,
            String userEmail
    ) {
        return eventRepository
                .findAllForUserBetween(userEmail, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ApplicationEventResponse createEvent(
            Long applicationId,
            SaveApplicationEventRequest request,
            String userEmail
    ) {
        Application application = applicationRepository
                .findByIdAndOwnerEmailIgnoreCase(
                        applicationId,
                        userEmail
                )
                .orElseThrow(() ->
                        new ApplicationNotFoundException(applicationId)
                );

        ApplicationEvent event = new ApplicationEvent(
                application,
                request.type(),
                request.scheduledAt()
        );

        event.setNotes(normalizeNotes(request.notes()));

        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public ApplicationEventResponse updateEvent(
            Long eventId,
            SaveApplicationEventRequest request,
            String userEmail
    ) {
        ApplicationEvent event = findEvent(eventId, userEmail);

        event.setType(request.type());
        event.setScheduledAt(request.scheduledAt());
        event.setNotes(normalizeNotes(request.notes()));

        return toResponse(event);
    }

    @Transactional
    public ApplicationEventResponse completeEvent(
            Long eventId,
            String userEmail
    ) {
        ApplicationEvent event = findEvent(eventId, userEmail);

        event.markCompleted();

        return toResponse(event);
    }

    @Transactional
    public void deleteEvent(Long eventId, String userEmail) {
        eventRepository.delete(findEvent(eventId, userEmail));
    }

    private ApplicationEvent findEvent(
            Long eventId,
            String userEmail
    ) {
        return eventRepository
                .findOwnedById(eventId, userEmail)
                .orElseThrow(() ->
                        new ApplicationEventNotFoundException(eventId)
                );
    }

    private String normalizeNotes(String notes) {
        if (notes == null || notes.isBlank()) {
            return null;
        }

        return notes.trim();
    }

    private ApplicationEventResponse toResponse(
            ApplicationEvent event
    ) {
        Application application = event.getApplication();

        return new ApplicationEventResponse(
                event.getId(),
                application.getId(),
                application.getCompany(),
                application.getPosition(),
                event.getType(),
                event.getScheduledAt(),
                event.getCompletedAt(),
                event.getNotes()
        );
    }
}