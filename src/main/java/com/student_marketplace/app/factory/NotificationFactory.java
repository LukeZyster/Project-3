package com.student_marketplace.app.factory;

import com.student_marketplace.app.domain.Notification;

import java.time.LocalDateTime;

public class NotificationFactory {

    public static Notification createNotification(
            Long notificationId,
            Long userId,
            String type,
            String title,
            String message,
            boolean isRead,
            String link,
            LocalDateTime createdAt
    ) {

        return new Notification(
                notificationId,
                userId,
                type,
                title,
                message,
                isRead,
                link,
                createdAt
        );
    }


    public static Notification createNewNotification(
            Long userId,
            String type,
            String title,
            String message,
            String link
    ) {

        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title is required");
        }

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message is required");
        }

        return new Notification(
                null,
                userId,
                (type == null || type.isBlank()) ? "SYSTEM" : type,
                title,
                message,
                false,
                link,
                LocalDateTime.now()
        );
    }
}
