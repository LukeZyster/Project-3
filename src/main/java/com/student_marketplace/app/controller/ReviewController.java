package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.Review;
import com.student_marketplace.app.dto.CreateReviewRequest;
import com.student_marketplace.app.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private static final String USER_HEADER = "X-User-Id";

    private final ReviewRepository reviewRepository;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    public List<Review> getReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestHeader(value = USER_HEADER, defaultValue = "1") Long reviewerId,
            @RequestBody CreateReviewRequest request) {
        try {
            Review review = new Review();
            review.setReviewerId(reviewerId);
            review.setItem(requiredText(request.getItem(), "item", 120));
            review.setSeller(requiredText(request.getSeller(), "seller", 80));
            review.setItemRating(requiredRating(request.getItemRating(), "itemRating"));
            review.setServiceRating(requiredRating(request.getServiceRating(), "serviceRating"));
            review.setComment(requiredText(request.getComment(), "comment", 600));
            review.setReviewer(requiredText(request.getReviewer(), "reviewer", 80));
            review.setCreatedAt(LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.CREATED).body(reviewRepository.save(review));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
        }
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