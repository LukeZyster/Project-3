package com.student_marketplace.app.serviceTest;

import com.student_marketplace.app.domain.Notification;
import com.student_marketplace.app.repository.NotificationRepository;
import com.student_marketplace.app.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class NotificationServiceTest {

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(new NotificationRepository());
    }



    @Test
    void userCanReceiveOneOrMoreNotifications() {

        notificationService.sendNotification(1L, "PRICE_DROP", "Price Drop", "Price fell.", null);
        notificationService.sendNotification(1L, "NEW_LISTING", "New Listing", "Item posted.", null);

        assertEquals(2, notificationService.getNotificationsForUser(1L).size());
    }

    @Test
    void sentNotificationShouldBeUnreadAndHaveAnId() {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "Hi", "Hello", null);

        assertNotNull(sent.getNotificationId());
        assertFalse(sent.getIsRead());
        assertEquals(1, notificationService.getUnreadCount(1L));
    }

    @Test
    void sendShouldRejectInvalidInput() {

        assertThrows(IllegalArgumentException.class, () ->
                notificationService.sendNotification(1L, "SYSTEM", "", "Hello", null)
        );
    }



    @Test
    void userCanMarkOwnNotificationAsRead() {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "T", "M", null);

        assertTrue(notificationService.markAsRead(1L, sent.getNotificationId()).isPresent());
        assertTrue(notificationService.getNotificationsForUser(1L).get(0).getIsRead());
        assertEquals(0, notificationService.getUnreadCount(1L));
    }

    @Test
    void userCannotMarkAnotherUsersNotificationAsRead() {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "T", "M", null);

        assertTrue(notificationService.markAsRead(2L, sent.getNotificationId()).isEmpty());
        assertEquals(1, notificationService.getUnreadCount(1L));
    }

    @Test
    void markAsReadShouldReturnEmptyForMissingNotification() {

        assertTrue(notificationService.markAsRead(1L, 999L).isEmpty());
    }



    @Test
    void userCanDeleteOwnNotification() {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "T", "M", null);

        assertTrue(notificationService.deleteNotification(1L, sent.getNotificationId()));
        assertTrue(notificationService.getNotificationsForUser(1L).isEmpty());
    }

    @Test
    void userCannotDeleteAnotherUsersNotification() {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "T", "M", null);

        assertFalse(notificationService.deleteNotification(2L, sent.getNotificationId()));
        assertEquals(1, notificationService.getNotificationsForUser(1L).size());
    }

    @Test
    void clearAllShouldOnlyDeleteCurrentUsersNotifications() {

        notificationService.sendNotification(1L, "SYSTEM", "A", "M", null);
        notificationService.sendNotification(1L, "SYSTEM", "B", "M", null);
        notificationService.sendNotification(2L, "SYSTEM", "C", "M", null);

        assertEquals(2, notificationService.clearAll(1L));
        assertTrue(notificationService.getNotificationsForUser(1L).isEmpty());
        assertEquals(1, notificationService.getNotificationsForUser(2L).size());
    }
}
