package com.student_marketplace.app.domain;

import java.time.LocalDateTime;

public class Announcement {

    private Long id;

    private String subject;

    private String body;

    private LocalDateTime scheduledDateTime;

    private boolean published;

    private Long adminId;


    // Default constructor
    public Announcement() {
    }


    // Constructor
    public Announcement(
            Long id,
            String subject,
            String body,
            LocalDateTime scheduledDateTime,
            boolean published,
            Long adminId
    ) {

        this.id = id;
        this.subject = subject;
        this.body = body;
        this.scheduledDateTime = scheduledDateTime;
        this.published = published;
        this.adminId = adminId;
    }


    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }


    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }


    public LocalDateTime getScheduledDateTime() {
        return scheduledDateTime;
    }

    public void setScheduledDateTime(LocalDateTime scheduledDateTime) {
        this.scheduledDateTime = scheduledDateTime;
    }


    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }


    public Long getAdminId() {
        return adminId;
    }

    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }
}