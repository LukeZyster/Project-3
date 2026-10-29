package com.student_marketplace.app.factory;

import com.student_marketplace.app.domain.Announcement;

import java.time.LocalDateTime;

public class AnnouncementFactory {

    public static Announcement createAnnouncement(
            Long id,
            String subject,
            String body,
            LocalDateTime scheduledDateTime,
            boolean published,
            Long adminId
    ) {

        return new Announcement(
                id,
                subject,
                body,
                scheduledDateTime,
                published,
                adminId
        );
    }
}