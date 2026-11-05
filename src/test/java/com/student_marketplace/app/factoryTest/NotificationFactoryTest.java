package com.student_marketplace.app.factoryTest;

import com.student_marketplace.app.domain.Notification;
import com.student_marketplace.app.factory.NotificationFactory;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class NotificationFactoryTest {

    @Test
    void shouldCreateNotificationWithAllErdFields() {

        LocalDateTime createdAt = LocalDateTime.of(2026, 11, 2, 10, 30);

        Notification notification = NotificationFactory.createNotification(
                1L,
                5L,
                "PRICE_DROP",
                "Price Drop",
                "MacBook Air M2 dropped by 15%.",
                true,
                "/marketplace.html",
                createdAt
        );

        assertEquals(1L, notification.getNotificationId());
        assertEquals(5L, notification.getUserId());
        assertEquals("PRICE_DROP", notification.getType());
        assertEquals("Price Drop", notification.getTitle());
        assertEquals("MacBook Air M2 dropped by 15%.", notification.getMessage());
        assertTrue(notification.getIsRead());
        assertEquals("/marketplace.html", notification.getLink());
        assertEquals(createdAt, notification.getCreatedAt());
    }

    @Test
    void newNotificationShouldStartUnreadWithNoIdAndATimestamp() {

        Notification notification = NotificationFactory.createNewNotification(
                5L, "NEW_LISTING", "New Listing", "A camera was posted.", null
        );

        assertNull(notification.getNotificationId());
        assertFalse(notification.getIsRead());
        assertNotNull(notification.getCreatedAt());
        assertEquals(5L, notification.getUserId());
    }

    @Test
    void newNotificationShouldDefaultTypeToSystem() {

        Notification notification = NotificationFactory.createNewNotification(
                5L, null, "Update", "New version available.", null
        );

        assertEquals("SYSTEM", notification.getType());
    }

    @Test
    void shouldRejectMissingUserId() {

        assertThrows(IllegalArgumentException.class, () ->
                NotificationFactory.createNewNotification(
                        null, "SYSTEM", "Title", "Message", null
                )
        );
    }

    @Test
    void shouldRejectBlankTitle() {

        assertThrows(IllegalArgumentException.class, () ->
                NotificationFactory.createNewNotification(
                        5L, "SYSTEM", "  ", "Message", null
                )
        );
    }

    @Test
    void shouldRejectBlankMessage() {

        assertThrows(IllegalArgumentException.class, () ->
                NotificationFactory.createNewNotification(
                        5L, "SYSTEM", "Title", "", null
                )
        );
    }
}
