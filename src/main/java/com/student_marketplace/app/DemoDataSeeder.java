package com.student_marketplace.app;

import com.student_marketplace.app.domain.MerchItem;
import com.student_marketplace.app.domain.Notification;
import com.student_marketplace.app.repository.MerchItemRepository;
import com.student_marketplace.app.repository.NotificationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Adds repeatable demo content so a fresh app has a populated store and inbox. */
@Component
public class DemoDataSeeder implements CommandLineRunner {

    private static final Long DEMO_USER_ID = 1L;

    private final MerchItemRepository merchRepository;
    private final NotificationRepository notificationRepository;

    public DemoDataSeeder(
            MerchItemRepository merchRepository,
            NotificationRepository notificationRepository
    ) {
        this.merchRepository = merchRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void run(String... args) {
        seedMerch();
        seedNotifications();
    }

    private void seedMerch() {
        if (merchRepository.count() > 0) return;

        merchRepository.saveAll(List.of(
                merch("Campus Hoodie", "Official university hoodie with an embroidered crest.", "499.99", "Clothing", 12, "S,M,L,XL", "Navy,Maroon"),
                merch("Student Tee", "Soft cotton tee for everyday campus wear.", "199.99", "Clothing", 20, "S,M,L,XL", "White,Navy"),
                merch("Travel Mug", "Insulated mug for lectures and commutes.", "89.99", "Drinkware", 18, "350ml", "Black,Blue"),
                merch("Notebook Set", "A practical set of notebooks for the semester.", "59.99", "Stationery", 30, "A5", "Blue,Green"),
                merch("Campus Cap", "A lightweight cap for sunny days on campus.", "149.99", "Clothing", 14, "One size", "Navy,White"),
                merch("Laptop Sleeve", "A padded sleeve to protect your laptop.", "329.99", "Accessories", 8, "13,14,15 inch", "Charcoal"),
                merch("Water Bottle", "Reusable bottle for long days between classes.", "119.99", "Drinkware", 16, "750ml", "Blue,Green"),
                merch("Study Planner", "Plan assignments, exams, and study sessions.", "79.99", "Stationery", 22, "A5", "Yellow,Blue"),
                merch("Campus Socks", "Comfortable everyday socks in campus colors.", "69.99", "Clothing", 25, "S,M,L", "Navy,White"),
                merch("Exam Highlighter Pack", "Bright colors for notes and revision.", "39.99", "Stationery", 35, "Pack of 5", "Mixed")
        ));
    }

    private MerchItem merch(
            String name, String description, String price, String category,
            int stock, String sizes, String colors
    ) {
        return MerchItem.builder()
                .name(name)
                .description(description)
                .price(new BigDecimal(price))
                .category(category)
                .stock(stock)
                .sizes(sizes)
                .colors(colors)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void seedNotifications() {
        if (!notificationRepository.findByUserId(DEMO_USER_ID).isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        notificationRepository.save(notification( "NEW_LISTING", "New campus gear", "The Campus Hoodie and Student Tee are available in the store.", false, now.minusMinutes(25)));
        notificationRepository.save(notification("MESSAGE", "Seller replied", "A seller replied to your question about the Campus Cap.", false, now.minusHours(2)));
        notificationRepository.save(notification("OFFER_ACCEPTED", "Purchase completed", "Your Travel Mug order was completed successfully.", true, now.minusDays(1)));
        notificationRepository.save(notification("PRICE_DROP", "Price drop", "The Study Planner is now R79.99 for a limited time.", true, now.minusDays(2)));
        notificationRepository.save(notification("ANNOUNCEMENT", "Welcome to StudentMarket", "Browse campus essentials and find something useful for the semester.", true, now.minusDays(4)));
    }

    private Notification notification(
            String type, String title, String message, boolean isRead, LocalDateTime createdAt
    ) {
        return new Notification(
                null, DEMO_USER_ID, type, title, message, isRead, "/merch.html", createdAt
        );
    }
}
