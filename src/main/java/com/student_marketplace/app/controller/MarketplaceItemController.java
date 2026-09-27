package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.MarketplaceItem;

import java.util.ArrayList;
import java.util.List;

    public class MarketplaceItemController {

        private List<MarketplaceItem> marketplaceItems;

        private MerchController merchController;

        public MarketplaceItemController() {
            marketplaceItems = new ArrayList<>();
            merchController = new MerchController();
        }


        public void createMarketplaceItem(MarketplaceItem marketplaceItem) {
            marketplaceItems.add(marketplaceItem);
        }

        public List<MarketplaceItem> getAllMarketplaceItems() {
            return marketplaceItems;
        }

        public MarketplaceItem getMarketplaceItemById(Long id) {

            for (MarketplaceItem marketplaceItem : marketplaceItems) {

                if (marketplaceItem.getId().equals(id)) {
                    return marketplaceItem;
                }
            }

            return null;
        }

        public boolean updateMarketplaceItem(Long id, MarketplaceItem updatedMarketplaceItem) {

            MarketplaceItem existingMarketplaceItem = getMarketplaceItemById(id);

            if (existingMarketplaceItem != null) {

                existingMarketplaceItem.setTitle(updatedMarketplaceItem.getTitle());
                existingMarketplaceItem.setDescription(updatedMarketplaceItem.getDescription());
                existingMarketplaceItem.setPrice(updatedMarketplaceItem.getPrice());
                existingMarketplaceItem.setCategory(updatedMarketplaceItem.getCategory());
                existingMarketplaceItem.setSellerId(updatedMarketplaceItem.getSellerId());
                existingMarketplaceItem.setDatePosted(
                        updatedMarketplaceItem.getDatePosted()
                );
                existingMarketplaceItem.setSold(updatedMarketplaceItem.isSold());

                return true;
            }

            return false;
        }

        public boolean deleteMarketplaceItem(Long id) {

            MarketplaceItem marketplaceItem = getMarketplaceItemById(id);

            if (marketplaceItem != null) {
                marketplaceItems.remove(marketplaceItem);
                return true;
            }

            return false;
        }

    }

//        public void goToMerchStore() {
//            merchController.openMerchStore();
//        }
//    }
