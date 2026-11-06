package com.student_marketplace.app.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "removed_marketplace_listings")
public class RemovedMarketplaceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 160)
    private String listingId;

    @Column(nullable = false)
    private Long removedByUserId;

    @Column(nullable = false)
    private LocalDateTime removedAt;

    public RemovedMarketplaceListing() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getListingId() {
        return listingId;
    }

    public void setListingId(String listingId) {
        this.listingId = listingId;
    }

    public Long getRemovedByUserId() {
        return removedByUserId;
    }

    public void setRemovedByUserId(Long removedByUserId) {
        this.removedByUserId = removedByUserId;
    }

    public LocalDateTime getRemovedAt() {
        return removedAt;
    }

    public void setRemovedAt(LocalDateTime removedAt) {
        this.removedAt = removedAt;
    }
}