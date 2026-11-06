package com.student_marketplace.app.controllerTest;

import com.student_marketplace.app.controller.ReviewController;
import com.student_marketplace.app.domain.Review;
import com.student_marketplace.app.domain.User;
import com.student_marketplace.app.repository.ReviewRepository;
import com.student_marketplace.app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReviewControllerTest {

    private MockMvc mockMvc;
    private ReviewRepository reviewRepository;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        reviewRepository = mock(ReviewRepository.class);
        userRepository = mock(UserRepository.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ReviewController(reviewRepository, userRepository)).build();
    }

    @Test
    void shouldListReviewsFromDifferentUsers() throws Exception {
        Review first = createReview(1L, 10L, "Used textbook", "Anele");
        Review second = createReview(2L, 20L, "Study desk", "Mila");
        when(reviewRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(first, second));

        mockMvc.perform(get("/api/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].reviewerId").value(10))
                .andExpect(jsonPath("$[1].reviewerId").value(20));
    }

    @Test
    void shouldSaveReviewWithSubmittingUserId() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(createUser(42L, "USER")));
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review saved = invocation.getArgument(0);
            saved.setId(4L);
            return saved;
        });
        String body = """
                {
                    "item": "Used textbook",
                    "seller": "Anele",
                    "itemRating": 5,
                    "serviceRating": 4,
                    "comment": "As described and easy to arrange.",
                    "reviewer": "Nandi"
                }
                """;

        mockMvc.perform(post("/api/reviews")
                        .sessionAttr("studentMarketUserId", 42L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.reviewerId").value(42))
                .andExpect(jsonPath("$.reviewer").value("User 42"))
                .andExpect(jsonPath("$.item").value("Used textbook"));

        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void shouldRejectInvalidRatings() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(createUser(42L, "USER")));
        String body = """
                {
                    "item": "Used textbook",
                    "seller": "Anele",
                    "itemRating": 6,
                    "serviceRating": 4,
                    "comment": "As described.",
                    "reviewer": "Nandi"
                }
                """;

        mockMvc.perform(post("/api/reviews")
                        .sessionAttr("studentMarketUserId", 42L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("itemRating must be between 1 and 5"));
    }

    @Test
    void shouldAllowAdminsToDeleteReviews() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(createUser(42L, "ADMIN")));
        when(reviewRepository.existsById(7L)).thenReturn(true);

        mockMvc.perform(delete("/api/reviews/7").sessionAttr("studentMarketUserId", 42L))
                .andExpect(status().isNoContent());

        verify(reviewRepository).deleteById(7L);
    }

    @Test
    void shouldRejectReviewDeletionForNonAdmins() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(createUser(42L, "USER")));
        mockMvc.perform(delete("/api/reviews/7").sessionAttr("studentMarketUserId", 42L))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Only admins can delete reviews"));

        verify(reviewRepository, never()).existsById(7L);
        verify(reviewRepository, never()).deleteById(7L);
    }

    @Test
    void shouldIgnoreAdminRoleHeaderWithoutAnAdminSession() throws Exception {
        mockMvc.perform(delete("/api/reviews/7").header("X-User-Role", "ADMIN"))
                .andExpect(status().isForbidden());

        verify(reviewRepository, never()).existsById(7L);
        verify(reviewRepository, never()).deleteById(7L);
    }

    @Test
    void shouldReturnNotFoundWhenAdminDeletesMissingReview() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(createUser(42L, "ADMIN")));
        when(reviewRepository.existsById(7L)).thenReturn(false);

        mockMvc.perform(delete("/api/reviews/7").sessionAttr("studentMarketUserId", 42L))
                .andExpect(status().isNotFound());

        verify(reviewRepository, never()).deleteById(7L);
    }

    private Review createReview(Long id, Long reviewerId, String item, String seller) {
        Review review = new Review();
        review.setId(id);
        review.setReviewerId(reviewerId);
        review.setItem(item);
        review.setSeller(seller);
        review.setItemRating(5);
        review.setServiceRating(4);
        review.setComment("Good experience.");
        review.setReviewer("Student " + reviewerId);
        review.setCreatedAt(LocalDateTime.now());
        return review;
    }

    private User createUser(Long id, String role) {
        User user = new User();
        user.setId(id);
        user.setName("User " + id);
        user.setEmail("user" + id + "@example.com");
        user.setRole(role);
        return user;
    }
}