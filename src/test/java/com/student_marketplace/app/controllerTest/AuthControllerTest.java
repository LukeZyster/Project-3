package com.student_marketplace.app.controllerTest;

import com.student_marketplace.app.controller.AuthController;
import com.student_marketplace.app.domain.User;
import com.student_marketplace.app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private MockMvc mockMvc;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(userRepository, passwordEncoder)).build();
    }

    @Test
    void shouldCreateServerSessionOnLogin() throws Exception {
        User admin = user(8L, "owner@example.com", "ADMIN");
        admin.setPasswordHash("hashed-password");
        when(userRepository.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("password-123", "hashed-password")).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"owner@example.com","password":"password-123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(8))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(request().sessionAttribute("studentMarketUserId", 8L));
    }

    @Test
    void shouldAllowAdminToPromoteUser() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "admin@example.com", "ADMIN")));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L, "student@example.com", "USER")));
        when(userRepository.countByRole("ADMIN")).thenReturn(1L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(patch("/api/admin/users/2/role")
                        .sessionAttr("studentMarketUserId", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("student@example.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));

        verify(userRepository).save(any(User.class));
    }

    @Test
    void shouldRejectRoleChangesFromRegularUsers() throws Exception {
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L, "student@example.com", "USER")));

        mockMvc.perform(patch("/api/admin/users/3/role")
                        .sessionAttr("studentMarketUserId", 2L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    private User user(Long id, String email, String role) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName("User " + id);
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }
}