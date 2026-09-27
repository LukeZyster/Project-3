package com.student_marketplace.app.domain;

import java.time.LocalDateTime;

public class MarketplaceItem {

    private Long id;

    private String title;

    private String description;

    private double price;

    private String category;

    private Long sellerId;

    private LocalDateTime datePosted;

    private boolean sold;


    public MarketplaceItem() {
    }


    public MarketplaceItem(
            Long id,
            String title,
            String description,
            double price,
            String category,
            Long sellerId,
            LocalDateTime datePosted,
            boolean sold
    ) {

        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.category = category;
        this.sellerId = sellerId;
        this.datePosted = datePosted;
        this.sold = sold;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }


    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }


    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }


    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }


    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }


    public LocalDateTime getDatePosted() {
        return datePosted;
    }

    public void setDatePosted(LocalDateTime datePosted) {
        this.datePosted = datePosted;
    }


    public boolean isSold() {
        return sold;
    }

    public void setSold(boolean sold) {
        this.sold = sold;
    }
}
