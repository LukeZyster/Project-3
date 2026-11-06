package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.RemovedMarketplaceListing;
import com.student_marketplace.app.domain.User;
import com.student_marketplace.app.repository.RemovedMarketplaceListingRepository;
import com.student_marketplace.app.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/moderation/listings")
public class MarketplaceModerationController {

    private static final String USER_ID_ATTRIBUTE = "studentMarketUserId";

    private final RemovedMarketplaceListingRepository removedListingRepository;
    private final UserRepository userRepository;

    public MarketplaceModerationController(
            RemovedMarketplaceListingRepository removedListingRepository,
            UserRepository userRepository) {
        this.removedListingRepository = removedListingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<String> getRemovedListingIds() {
        return removedListingRepository.findAll().stream()
                .map(RemovedMarketplaceListing::getListingId)
                .toList();
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<?> removeListing(
            HttpServletRequest request,
            @PathVariable String listingId) {
        Optional<User> admin = getSessionUser(request)
                .filter(user -> "ADMIN".equals(user.getRole()));
        if (admin.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        String normalizedId = listingId.trim();
        if (normalizedId.isEmpty() || normalizedId.length() > 160) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid listing ID"));
        }
        if (removedListingRepository.findByListingId(normalizedId).isEmpty()) {
            RemovedMarketplaceListing removed = new RemovedMarketplaceListing();
            removed.setListingId(normalizedId);
            removed.setRemovedByUserId(admin.get().getId());
            removed.setRemovedAt(LocalDateTime.now());
            removedListingRepository.save(removed);
        }
        return ResponseEntity.noContent().build();
    }

    private Optional<User> getSessionUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object userId = session == null ? null : session.getAttribute(USER_ID_ATTRIBUTE);
        if (!(userId instanceof Number numericId)) return Optional.empty();
        return userRepository.findById(numericId.longValue());
    }
}