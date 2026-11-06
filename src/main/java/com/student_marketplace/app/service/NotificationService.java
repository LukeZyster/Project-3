package com.student_marketplace.app.service;

import com.student_marketplace.app.domain.Notification;
import com.student_marketplace.app.factory.NotificationFactory;
import com.student_marketplace.app.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;


    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }


    public Notification sendNotification(
            Long userId,
            String type,
            String title,
            String message,
            String link
    ) {

        Notification notification = NotificationFactory.createNewNotification(
                userId, type, title, message, link
        );

        return notificationRepository.save(notification);
    }


    public List<Notification> getNotificationsForUser(Long userId) {

        return notificationRepository.findByUserId(userId);
    }


    public long getUnreadCount(Long userId) {

        return notificationRepository.findByUserId(userId).stream()
                .filter(n -> !n.getIsRead())
                .count();
    }


    public Optional<Notification> markAsRead(Long userId, Long notificationId) {

        return findOwned(userId, notificationId)
                .map(notification -> {
                    notification.setIsRead(true);
                    return notificationRepository.save(notification);
                });
    }


    public boolean deleteNotification(Long userId, Long notificationId) {

        return findOwned(userId, notificationId)
                .map(n -> notificationRepository.deleteById(notificationId))
                .orElse(false);
    }


    public int clearAll(Long userId) {

        return notificationRepository.deleteByUserId(userId);
    }


    private Optional<Notification> findOwned(Long userId, Long notificationId) {

        return notificationRepository.findById(notificationId)
                .filter(n -> n.getUserId().equals(userId));
    }
}
