package com.bahen.jobtracker.calendar;

import com.bahen.jobtracker.calendar.dto.ApplicationEventResponse;
import com.bahen.jobtracker.calendar.dto.SaveApplicationEventRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@Tag(
        name = "Calendar",
        description = "Manage calendar events for job applications"
)
@RestController
@RequestMapping("/api")
public class ApplicationEventController {

    private final ApplicationEventService eventService;

    public ApplicationEventController(
            ApplicationEventService eventService
    ) {
        this.eventService = eventService;
    }

    @Operation(summary = "Get calendar events in a date range")
    @GetMapping("/events")
    public List<ApplicationEventResponse> getEvents(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant to,

            Authentication authentication
    ) {
        return eventService.getEvents(
                from,
                to,
                authentication.getName()
        );
    }

    @Operation(summary = "Create an event for an application")
    @PostMapping("/applications/{applicationId}/events")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationEventResponse createEvent(
            @PathVariable Long applicationId,
            @Valid @RequestBody SaveApplicationEventRequest request,
            Authentication authentication
    ) {
        return eventService.createEvent(
                applicationId,
                request,
                authentication.getName()
        );
    }

    @Operation(summary = "Update a calendar event")
    @PutMapping("/events/{eventId}")
    public ApplicationEventResponse updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody SaveApplicationEventRequest request,
            Authentication authentication
    ) {
        return eventService.updateEvent(
                eventId,
                request,
                authentication.getName()
        );
    }

    @Operation(summary = "Mark a calendar event as completed")
    @PatchMapping("/events/{eventId}/complete")
    public ApplicationEventResponse completeEvent(
            @PathVariable Long eventId,
            Authentication authentication
    ) {
        return eventService.completeEvent(
                eventId,
                authentication.getName()
        );
    }

    @Operation(summary = "Delete a calendar event")
    @DeleteMapping("/events/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(
            @PathVariable Long eventId,
            Authentication authentication
    ) {
        eventService.deleteEvent(
                eventId,
                authentication.getName()
        );
    }
}