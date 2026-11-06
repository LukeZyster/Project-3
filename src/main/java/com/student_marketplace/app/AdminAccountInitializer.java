package com.student_marketplace.app;

import com.student_marketplace.app.domain.User;
import com.student_marketplace.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;

@Component
public class AdminAccountInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminAccountInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String adminEmail,
            @Value("${app.admin.password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (adminEmail.isEmpty() && adminPassword.isEmpty()) return;
        if (!adminEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || adminPassword == null
                || adminPassword.length() < 8
                || adminPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("Configure a valid ADMIN_EMAIL and an ADMIN_PASSWORD of 8 to 72 UTF-8 bytes");
        }

        User admin = userRepository.findByEmailIgnoreCase(adminEmail).orElseGet(() -> {
            User created = new User();
            created.setEmail(adminEmail);
            created.setName(adminEmail.substring(0, adminEmail.indexOf('@')));
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        admin.setRole("ADMIN");
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        userRepository.save(admin);
    }
}