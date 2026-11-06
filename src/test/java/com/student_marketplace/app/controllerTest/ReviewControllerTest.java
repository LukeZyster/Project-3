package com.student_marketplace.app.controllerTest;

import com.student_marketplace.app.controller.ReviewController;
import com.student_marketplace.app.domain.Review;
import com.student_marketplace.app.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReviewControllerTest {

    private MockMvc mockMvc;
    private ReviewRepository reviewRepository;

    @BeforeEach
    void setUp() {
        reviewRepository = mock(ReviewRepository.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ReviewController(reviewRepository)).build();
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
                        .header("X-User-Id", "42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.reviewerId").value(42))
                .andExpect(jsonPath("$.item").value("Used textbook"));

        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void shouldRejectInvalidRatings() throws Exception {
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("itemRating must be between 1 and 5"));
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
}