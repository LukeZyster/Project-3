package com.student_marketplace.app;

import com.student_marketplace.app.controller.MarketplaceItemController;
import com.student_marketplace.app.domain.MarketplaceItem;
import com.student_marketplace.app.factory.MarketplaceItemFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class MarketplaceItemControllerTest {

    private MarketplaceItemController controller;
    private MarketplaceItem item1;
    private MarketplaceItem item2;

    @BeforeEach
    void setUp() {
        controller = new MarketplaceItemController();

        item1 = MarketplaceItemFactory.createMarketplaceItem(
                1L, "Calculus Textbook", "Barely used", 250.0,
                "Textbooks", 42L, LocalDateTime.now(), false
        );
        item2 = MarketplaceItemFactory.createMarketplaceItem(
                2L, "Desk Lamp", "Works great", 80.0,
                "Furniture", 43L, LocalDateTime.now(), false
        );

        controller.createMarketplaceItem(item1);
        controller.createMarketplaceItem(item2);
    }

    @Test
    void createMarketplaceItem_addsItemToList() {
        assertEquals(2, controller.getAllMarketplaceItems().size());
    }

    @Test
    void getMarketplaceItemById_returnsCorrectItem() {
        MarketplaceItem fetched = controller.getMarketplaceItemById(1L);
        assertNotNull(fetched);
        assertEquals("Calculus Textbook", fetched.getTitle());
    }

    @Test
    void getMarketplaceItemById_returnsNullForMissingId() {
        assertNull(controller.getMarketplaceItemById(999L));
    }

    @Test
    void updateMarketplaceItem_updatesExistingItemAndReturnsTrue() {
        MarketplaceItem updated = MarketplaceItemFactory.createMarketplaceItem(
                1L, "Calculus Textbook 3rd Ed", "Like new", 300.0,
                "Textbooks", 42L, LocalDateTime.now(), true
        );

        boolean result = controller.updateMarketplaceItem(1L, updated);

        assertTrue(result);
        assertEquals(300.0, controller.getMarketplaceItemById(1L).getPrice());
        assertTrue(controller.getMarketplaceItemById(1L).isSold());
    }

    @Test
    void updateMarketplaceItem_returnsFalseForMissingId() {
        MarketplaceItem updated = MarketplaceItemFactory.createMarketplaceItem(
                999L, "Ghost Item", "N/A", 0.0,
                "None", 0L, LocalDateTime.now(), false
        );

        boolean result = controller.updateMarketplaceItem(999L, updated);

        assertFalse(result);
    }

    @Test
    void deleteMarketplaceItem_removesItemAndReturnsTrue() {
        boolean result = controller.deleteMarketplaceItem(2L);

        assertTrue(result);
        assertEquals(1, controller.getAllMarketplaceItems().size());
        assertNull(controller.getMarketplaceItemById(2L));
    }

    @Test
    void deleteMarketplaceItem_returnsFalseForMissingId() {
        boolean result = controller.deleteMarketplaceItem(999L);
        assertFalse(result);
    }
}