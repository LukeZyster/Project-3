package com.student_marketplace.app.factory;

import com.student_marketplace.app.domain.MarketplaceItem;

import java.time.LocalDateTime;

public class MarketplaceItemFactory {

    public static MarketplaceItem createMarketplaceItem(
            Long id,
            String title,
            String description,
            double price,
            String category,
            Long sellerId,
            LocalDateTime datePosted,
            boolean sold
    ) {

        return new MarketplaceItem(
                id,
                title,
                description,
                price,
                category,
                sellerId,
                datePosted,
                sold
        );
    }
}