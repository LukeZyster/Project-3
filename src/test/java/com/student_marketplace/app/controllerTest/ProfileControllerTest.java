package com.student_marketplace.app.controllerTest;


import com.student_marketplace.app.controller.ProfileController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldGetAllProfiles() throws Exception {

        mockMvc.perform(
                        get("/api/profile")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldGetProfileById() throws Exception {

        mockMvc.perform(
                        get("/api/profile/1")
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.name")
                                .value("Lerato Dlamini")
                )
                .andExpect(
                        jsonPath("$.course")
                                .value("Computer Science")
                );
    }

    @Test
    void shouldReturnNullForNonExistingProfile()
            throws Exception {

        mockMvc.perform(
                        get("/api/profile/999")
                )
                .andExpect(status().isOk());
    }

    @Test
    void shouldUpdateProfile() throws Exception {

        String updatedProfile = """
                {
                    "name": "Updated Student",
                    "course": "Information Technology",
                    "year": "3rd Year",
                    "studentId": "219045678",
                    "university": "Cape Peninsula University of Technology",
                    "faculty": "Informatics & Design",
                    "about": "Updated profile.",
                    "coursesEnrolled": 5,
                    "assignments": 12,
                    "averageGrade": 80,
                    "unreadNotifications": 2
                }
                """;

        mockMvc.perform(
                        put("/api/profile/1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(updatedProfile)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.name")
                                .value("Updated Student")
                )
                .andExpect(
                        jsonPath("$.averageGrade")
                                .value(80)
                );
    }
}