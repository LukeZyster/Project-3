package com.student_marketplace.app.repositoryTest;

import com.student_marketplace.app.domain.Notification;
import com.student_marketplace.app.factory.NotificationFactory;
import com.student_marketplace.app.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class NotificationRepositoryTest {

    private NotificationRepository notificationRepository;

    @BeforeEach
    void setUp() {
        notificationRepository = new NotificationRepository();
    }


    private Notification notificationFor(Long userId, LocalDateTime createdAt) {

        return NotificationFactory.createNotification(
                null, userId, "SYSTEM", "Title", "Message", false, null, createdAt
        );
    }


    @Test
    void saveShouldAssignIncreasingIds() {

        Notification first = notificationRepository.save(notificationFor(1L, LocalDateTime.now()));
        Notification second = notificationRepository.save(notificationFor(1L, LocalDateTime.now()));

        assertEquals(1L, first.getNotificationId());
        assertEquals(2L, second.getNotificationId());
        assertEquals(2, notificationRepository.findAll().size());
    }

    @Test
    void saveShouldReplaceExistingNotification() {

        Notification saved = notificationRepository.save(notificationFor(1L, LocalDateTime.now()));

        saved.setIsRead(true);
        notificationRepository.save(saved);

        assertEquals(1, notificationRepository.findAll().size());
        assertTrue(notificationRepository.findById(saved.getNotificationId()).get().getIsRead());
    }

    @Test
    void findByIdShouldReturnEmptyWhenMissing() {

        assertTrue(notificationRepository.findById(999L).isEmpty());
    }

    @Test
    void findByUserIdShouldReturnOnlyThatUsersNotificationsNewestFirst() {

        LocalDateTime now = LocalDateTime.now();

        notificationRepository.save(notificationFor(1L, now.minusHours(2)));
        notificationRepository.save(notificationFor(1L, now));
        notificationRepository.save(notificationFor(2L, now.minusMinutes(5)));

        List<Notification> result = notificationRepository.findByUserId(1L);

        assertEquals(2, result.size());
        assertEquals(now, result.get(0).getCreatedAt());
        assertEquals(now.minusHours(2), result.get(1).getCreatedAt());
    }

    @Test
    void deleteByIdShouldRemoveNotification() {

        Notification saved = notificationRepository.save(notificationFor(1L, LocalDateTime.now()));

        assertTrue(notificationRepository.deleteById(saved.getNotificationId()));
        assertTrue(notificationRepository.findById(saved.getNotificationId()).isEmpty());
    }

    @Test
    void deleteByIdShouldReturnFalseWhenMissing() {

        assertFalse(notificationRepository.deleteById(999L));
    }

    @Test
    void deleteByUserIdShouldOnlyRemoveThatUsersNotifications() {

        notificationRepository.save(notificationFor(1L, LocalDateTime.now()));
        notificationRepository.save(notificationFor(1L, LocalDateTime.now()));
        notificationRepository.save(notificationFor(2L, LocalDateTime.now()));

        assertEquals(2, notificationRepository.deleteByUserId(1L));
        assertTrue(notificationRepository.findByUserId(1L).isEmpty());
        assertEquals(1, notificationRepository.findByUserId(2L).size());
    }
}
