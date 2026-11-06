package com.student_marketplace.app.controllerTest;

import com.student_marketplace.app.controller.NotificationController;
import com.student_marketplace.app.domain.Notification;
import com.student_marketplace.app.repository.NotificationRepository;
import com.student_marketplace.app.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NotificationControllerTest {

    private MockMvc mockMvc;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {

        notificationService = new NotificationService(new NotificationRepository());

        mockMvc = MockMvcBuilders
                .standaloneSetup(new NotificationController(notificationService))
                .build();
    }


    @Test
    void shouldGetCurrentUsersNotifications() throws Exception {

        notificationService.sendNotification(1L, "PRICE_DROP", "Price Drop", "Price fell.", null);
        notificationService.sendNotification(2L, "SYSTEM", "Other user", "Not yours.", null);

        mockMvc.perform(get("/api/notifications").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Price Drop"))
                .andExpect(jsonPath("$[0].userId").value(1))
                .andExpect(jsonPath("$[0].isRead").value(false));
    }

    @Test
    void shouldGetUnreadCount() throws Exception {

        notificationService.sendNotification(1L, "SYSTEM", "A", "M", null);
        notificationService.sendNotification(1L, "SYSTEM", "B", "M", null);

        mockMvc.perform(get("/api/notifications/unread-count").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unread").value(2));
    }

    @Test
    void shouldSendNotification() throws Exception {

        String body = """
                {
                    "userId": 1,
                    "type": "OFFER_ACCEPTED",
                    "title": "Offer Accepted",
                    "message": "Your offer was accepted.",
                    "link": "/chat.html"
                }
                """;

        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.notificationId").value(1))
                .andExpect(jsonPath("$.title").value("Offer Accepted"))
                .andExpect(jsonPath("$.isRead").value(false));
    }

    @Test
    void shouldRejectNotificationWithoutTitle() throws Exception {

        String body = """
                { "userId": 1, "type": "SYSTEM", "message": "No title" }
                """;

        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("title is required"));
    }

    @Test
    void shouldMarkNotificationAsRead() throws Exception {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "T", "M", null);

        mockMvc.perform(patch("/api/notifications/" + sent.getNotificationId() + "/read")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true));
    }

    @Test
    void shouldReturn404WhenMarkingAnotherUsersNotification() throws Exception {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "T", "M", null);

        mockMvc.perform(patch("/api/notifications/" + sent.getNotificationId() + "/read")
                        .header("X-User-Id", "2"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldDeleteNotification() throws Exception {

        Notification sent = notificationService.sendNotification(1L, "SYSTEM", "T", "M", null);

        mockMvc.perform(delete("/api/notifications/" + sent.getNotificationId())
                        .header("X-User-Id", "1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldReturn404WhenDeletingMissingNotification() throws Exception {

        mockMvc.perform(delete("/api/notifications/999").header("X-User-Id", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldClearAllForCurrentUser() throws Exception {

        notificationService.sendNotification(1L, "SYSTEM", "A", "M", null);
        notificationService.sendNotification(1L, "SYSTEM", "B", "M", null);

        mockMvc.perform(delete("/api/notifications").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(2));
    }
}
