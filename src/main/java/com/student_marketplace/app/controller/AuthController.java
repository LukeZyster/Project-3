package com.student_marketplace.app.controller;

import com.student_marketplace.app.domain.User;
import com.student_marketplace.app.dto.AuthRequest;
import com.student_marketplace.app.dto.RoleUpdateRequest;
import com.student_marketplace.app.dto.UserSummary;
import com.student_marketplace.app.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    private static final String USER_ID_ATTRIBUTE = "studentMarketUserId";
    private static final String USER_ROLE = "USER";
    private static final String ADMIN_ROLE = "ADMIN";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request, HttpServletRequest servletRequest) {
        String name = normalize(request.getName());
        String email = normalize(request.getEmail()).toLowerCase(Locale.ROOT);
        String password = request.getPassword();

        if (name.isEmpty() || name.length() > 80) {
            return badRequest("Name is required and must be at most 80 characters");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return badRequest("Enter a valid email address");
        }
        if (!validPassword(password)) {
            return badRequest("Password must be at least 8 characters and no more than 72 UTF-8 bytes");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "An account with this email already exists"));
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(USER_ROLE);
        user.setCreatedAt(LocalDateTime.now());
        User created = userRepository.save(user);
        establishSession(servletRequest, created);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserSummary.from(created));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletRequest servletRequest) {
        String email = normalize(request.getEmail()).toLowerCase(Locale.ROOT);
        String password = request.getPassword();
        Optional<User> matchingUser = userRepository.findByEmailIgnoreCase(email);
        if (!validPassword(password) || matchingUser.isEmpty() || !passwordEncoder.matches(password, matchingUser.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        User user = matchingUser.get();
        establishSession(servletRequest, user);
        return ResponseEntity.ok(UserSummary.from(user));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> currentUser(HttpServletRequest request) {
        return getSessionUser(request)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(UserSummary.from(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Sign in required")));
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/users")
    public ResponseEntity<?> getUsers(HttpServletRequest request) {
        if (!isAdmin(request)) return forbidden();
        List<UserSummary> users = userRepository.findAll().stream().map(UserSummary::from).toList();
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/admin/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(
            HttpServletRequest request,
            @PathVariable Long userId,
            @RequestBody RoleUpdateRequest roleRequest) {
        if (!isAdmin(request)) return forbidden();
        String role = normalize(roleRequest.getRole()).toUpperCase(Locale.ROOT);
        if (!USER_ROLE.equals(role) && !ADMIN_ROLE.equals(role)) {
            return badRequest("Role must be USER or ADMIN");
        }

        Optional<User> matchingUser = userRepository.findById(userId);
        if (matchingUser.isEmpty()) return ResponseEntity.notFound().build();

        User user = matchingUser.get();
        if (ADMIN_ROLE.equals(user.getRole()) && USER_ROLE.equals(role) && userRepository.countByRole(ADMIN_ROLE) <= 1) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "At least one admin account must remain"));
        }
        user.setRole(role);
        return ResponseEntity.ok(UserSummary.from(userRepository.save(user)));
    }

    private void establishSession(HttpServletRequest request, User user) {
        HttpSession session = request.getSession(true);
        request.changeSessionId();
        session.setAttribute(USER_ID_ATTRIBUTE, user.getId());
    }

    private Optional<User> getSessionUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object userId = session == null ? null : session.getAttribute(USER_ID_ATTRIBUTE);
        if (!(userId instanceof Number numericId)) return Optional.empty();
        return userRepository.findById(numericId.longValue());
    }

    private boolean isAdmin(HttpServletRequest request) {
        return getSessionUser(request).map(user -> ADMIN_ROLE.equals(user.getRole())).orElse(false);
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean validPassword(String password) {
        return password != null
                && password.length() >= 8
                && password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}