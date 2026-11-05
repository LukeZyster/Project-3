package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.Notification;
import com.student_marketplace.app.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final String USER_HEADER = "X-User-Id";

    private final NotificationService notificationService;


    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }


    @GetMapping
    public List<Notification> getNotifications(
            @RequestHeader(value = USER_HEADER, defaultValue = "1") Long userId) {

        return notificationService.getNotificationsForUser(userId);
    }


    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(
            @RequestHeader(value = USER_HEADER, defaultValue = "1") Long userId) {

        return Map.of("unread", notificationService.getUnreadCount(userId));
    }


    @PostMapping
    public ResponseEntity<?> sendNotification(@RequestBody Notification request) {

        try {

            Notification created = notificationService.sendNotification(
                    request.getUserId(),
                    request.getType(),
                    request.getTitle(),
                    request.getMessage(),
                    request.getLink()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markAsRead(
            @RequestHeader(value = USER_HEADER, defaultValue = "1") Long userId,
            @PathVariable Long notificationId) {

        return notificationService.markAsRead(userId, notificationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @RequestHeader(value = USER_HEADER, defaultValue = "1") Long userId,
            @PathVariable Long notificationId) {

        return notificationService.deleteNotification(userId, notificationId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }


    @DeleteMapping
    public Map<String, Integer> clearAll(
            @RequestHeader(value = USER_HEADER, defaultValue = "1") Long userId) {

        return Map.of("deleted", notificationService.clearAll(userId));
    }
}
