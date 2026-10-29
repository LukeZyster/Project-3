package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.Announcement;

import java.util.ArrayList;
import java.util.List;

public class AnnouncementController {

    private List<Announcement> announcements;


    // Default constructor
    public AnnouncementController() {
        announcements = new ArrayList<>();
    }


    // Create announcement
    public void createAnnouncement(Announcement announcement) {
        announcements.add(announcement);
    }


    // Get all announcements
    public List<Announcement> getAllAnnouncements() {
        return announcements;
    }


    // Get announcement by ID
    public Announcement getAnnouncementById(Long id) {

        for (Announcement announcement : announcements) {

            if (announcement.getId().equals(id)) {
                return announcement;
            }
        }

        return null;
    }


    // Update announcement
    public boolean updateAnnouncement(Long id, Announcement updatedAnnouncement) {

        Announcement existingAnnouncement = getAnnouncementById(id);

        if (existingAnnouncement != null) {

            existingAnnouncement.setSubject(updatedAnnouncement.getSubject());
            existingAnnouncement.setBody(updatedAnnouncement.getBody());
            existingAnnouncement.setScheduledDateTime(
                    updatedAnnouncement.getScheduledDateTime()
            );
            existingAnnouncement.setPublished(
                    updatedAnnouncement.isPublished()
            );
            existingAnnouncement.setAdminId(
                    updatedAnnouncement.getAdminId()
            );

            return true;
        }

        return false;
    }


    // Delete announcement
    public boolean deleteAnnouncement(Long id) {

        Announcement announcement = getAnnouncementById(id);

        if (announcement != null) {
            announcements.remove(announcement);
            return true;
        }

        return false;
    }
}
