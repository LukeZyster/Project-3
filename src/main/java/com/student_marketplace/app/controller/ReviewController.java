package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.Review;
import com.student_marketplace.app.domain.User;
import com.student_marketplace.app.dto.CreateReviewRequest;
import com.student_marketplace.app.repository.ReviewRepository;
import com.student_marketplace.app.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private static final String USER_ID_ATTRIBUTE = "studentMarketUserId";

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReviewController(ReviewRepository reviewRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Review> getReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            HttpServletRequest servletRequest,
            @RequestBody CreateReviewRequest reviewRequest) {
        Optional<User> author = getSessionUser(servletRequest);
        if (author.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Sign in required"));
        }
        try {
            Review review = new Review();
            review.setReviewerId(author.get().getId());
            review.setItem(requiredText(reviewRequest.getItem(), "item", 120));
            review.setSeller(requiredText(reviewRequest.getSeller(), "seller", 80));
            review.setItemRating(requiredRating(reviewRequest.getItemRating(), "itemRating"));
            review.setServiceRating(requiredRating(reviewRequest.getServiceRating(), "serviceRating"));
            review.setComment(requiredText(reviewRequest.getComment(), "comment", 600));
            review.setReviewer(author.get().getName());
            review.setCreatedAt(LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(reviewRepository.save(review));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            HttpServletRequest request,
            @PathVariable Long reviewId) {
        if (getSessionUser(request).filter(user -> "ADMIN".equals(user.getRole())).isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only admins can delete reviews"));
        }
        if (!reviewRepository.existsById(reviewId)) {
            return ResponseEntity.notFound().build();
        }
        reviewRepository.deleteById(reviewId);
        return ResponseEntity.noContent().build();
    }

    private Optional<User> getSessionUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object userId = session == null ? null : session.getAttribute(USER_ID_ATTRIBUTE);
        if (!(userId instanceof Number numericId)) return Optional.empty();
        return userRepository.findById(numericId.longValue());
    }

    private String requiredText(String value, String field, int maxLength) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException(field + " is required");
        }
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(field + " must be at most " + maxLength + " characters");
        }
        return normalized;
    }

    private int requiredRating(int rating, String field) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException(field + " must be between 1 and 5");
        }
        return rating;
    }
}