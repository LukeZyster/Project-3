package com.student_marketplace.app.domain;

import java.time.LocalDateTime;

public class Notification {

    private Long notificationId;

    private Long userId;

    private String type;

    private String title;

    private String message;

    private boolean isRead;

    private String link;

    private LocalDateTime createdAt;


    public Notification() {
    }


    public Notification(
            Long notificationId,
            Long userId,
            String type,
            String title,
            String message,
            boolean isRead,
            String link,
            LocalDateTime createdAt
    ) {

        this.notificationId = notificationId;
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.isRead = isRead;
        this.link = link;
        this.createdAt = createdAt;
    }



    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }


    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }


    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }


    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }


    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }


    public boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }


    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
