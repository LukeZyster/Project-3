package com.student_marketplace.app.repository;

import com.student_marketplace.app.domain.RemovedMarketplaceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RemovedMarketplaceListingRepository extends JpaRepository<RemovedMarketplaceListing, Long> {

    Optional<RemovedMarketplaceListing> findByListingId(String listingId);
}