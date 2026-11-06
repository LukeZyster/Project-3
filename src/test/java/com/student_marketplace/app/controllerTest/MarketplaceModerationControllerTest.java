package com.student_marketplace.app.controllerTest;

import com.student_marketplace.app.controller.MarketplaceModerationController;
import com.student_marketplace.app.domain.RemovedMarketplaceListing;
import com.student_marketplace.app.domain.User;
import com.student_marketplace.app.repository.RemovedMarketplaceListingRepository;
import com.student_marketplace.app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MarketplaceModerationControllerTest {

    private MockMvc mockMvc;
    private RemovedMarketplaceListingRepository removedListingRepository;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        removedListingRepository = mock(RemovedMarketplaceListingRepository.class);
        userRepository = mock(UserRepository.class);
        mockMvc = MockMvcBuilders.standaloneSetup(
                new MarketplaceModerationController(removedListingRepository, userRepository)
        ).build();
    }

    @Test
    void shouldPublishRemovedListingIdsToAllClients() throws Exception {
        RemovedMarketplaceListing removed = new RemovedMarketplaceListing();
        removed.setListingId("listing-123");
        when(removedListingRepository.findAll()).thenReturn(List.of(removed));

        mockMvc.perform(get("/api/moderation/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("listing-123"));
    }

    @Test
    void shouldAllowAdminSessionToRemoveListing() throws Exception {
        when(userRepository.findById(9L)).thenReturn(Optional.of(user(9L, "ADMIN")));
        when(removedListingRepository.findByListingId("listing-123")).thenReturn(Optional.empty());
        when(removedListingRepository.save(any(RemovedMarketplaceListing.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(delete("/api/moderation/listings/listing-123")
                        .sessionAttr("studentMarketUserId", 9L))
                .andExpect(status().isNoContent());

        verify(removedListingRepository).save(any(RemovedMarketplaceListing.class));
    }

    @Test
    void shouldRejectListingRemovalWithoutAdminSession() throws Exception {
        when(userRepository.findById(9L)).thenReturn(Optional.of(user(9L, "USER")));

        mockMvc.perform(delete("/api/moderation/listings/listing-123")
                        .sessionAttr("studentMarketUserId", 9L)
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isForbidden());

        verify(removedListingRepository, never()).findByListingId(anyString());
        verify(removedListingRepository, never()).save(any(RemovedMarketplaceListing.class));
    }

    private User user(Long id, String role) {
        User user = new User();
        user.setId(id);
        user.setName("User " + id);
        user.setEmail("user" + id + "@example.com");
        user.setRole(role);
        return user;
    }
}