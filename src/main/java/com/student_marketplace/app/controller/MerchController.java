package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.MerchItem;
import com.student_marketplace.app.dto.CreateMerchRequest;
import com.student_marketplace.app.dto.MerchItemDto;
import com.student_marketplace.app.factory.MerchItemFactory;
import com.student_marketplace.app.service.MerchService;
import com.student_marketplace.app.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/merch")
public class MerchController {

    // The current demo authentication flow has no persisted user IDs, so the
    // existing notifications demo account (ID 1) receives marketplace events.
    private static final Long DEMO_USER_ID = 1L;

    private final MerchService service;
    private final MerchItemFactory factory;
    private final NotificationService notificationService;

    public MerchController(
            MerchService service,
            MerchItemFactory factory,
            NotificationService notificationService
    ) {
        this.service = service;
        this.factory = factory;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<MerchItemDto> all(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category) {
        return service.findAll(q, category).stream()
                .map(factory::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public MerchItemDto one(@PathVariable Long id) {
        return factory.toDto(service.findById(id));
    }

    @PostMapping
    public MerchItemDto create(@RequestBody CreateMerchRequest req) {
        MerchItem saved = service.save(factory.fromCreateRequest(req));
        notificationService.sendNotification(
                DEMO_USER_ID,
                "NEW_LISTING",
                "New item for sale",
                saved.getName() + " is now available for R" + saved.getPrice() + ".",
                "/merch.html"
        );
        return factory.toDto(saved);
    }

    @PutMapping("/{id}")
    public MerchItemDto update(@PathVariable Long id, @RequestBody CreateMerchRequest req) {
        MerchItem existing = service.findById(id);
        Integer previousStock = existing.getStock();
        existing.setName(req.getName());
        existing.setDescription(req.getDescription());
        existing.setPrice(req.getPrice());
        existing.setImageUrl(req.getImageUrl());
        existing.setCategory(req.getCategory());
        existing.setStock(req.getStock());
        existing.setSizes(req.getSizes());
        existing.setColors(req.getColors());
        MerchItem saved = service.save(existing);

        if (previousStock != null && req.getStock() != null && req.getStock() < previousStock) {
            int soldQuantity = previousStock - req.getStock();
            notificationService.sendNotification(
                    DEMO_USER_ID,
                    "OFFER_ACCEPTED",
                    "Item sold",
                    soldQuantity + " × " + saved.getName() + " sold. "
                            + saved.getStock() + " remaining.",
                    "/merch.html"
            );
        }
        return factory.toDto(saved);
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<?> purchase(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int quantity
    ) {
        try {
            MerchItem saved = service.purchase(id, quantity);
            notificationService.sendNotification(
                    DEMO_USER_ID,
                    "OFFER_ACCEPTED",
                    "Item sold",
                    quantity + " × " + saved.getName() + " sold. "
                            + saved.getStock() + " remaining.",
                    "/merch.html"
            );
            return ResponseEntity.ok(factory.toDto(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
