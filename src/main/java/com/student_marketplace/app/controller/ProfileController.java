package com.student_marketplace.app.controller;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final Map<String, Object> profile =
            new HashMap<>();


    public ProfileController() {

        profile.put(
                "name",
                "Lerato Dlamini"
        );

        profile.put(
                "course",
                "Computer Science"
        );

        profile.put(
                "year",
                "3rd Year"
        );

        profile.put(
                "studentId",
                "219045678"
        );

        profile.put(
                "university",
                "Cape Peninsula University of Technology"
        );

        profile.put(
                "faculty",
                "Informatics & Design"
        );

        profile.put(
                "coursesEnrolled",
                5
        );

        profile.put(
                "assignments",
                12
        );

        profile.put(
                "averageGrade",
                78
        );

        profile.put(
                "unreadNotifications",
                3
        );
    }


    @GetMapping("/profile")
    public Map<String, Object> getProfile() {

        return profile;
    }


    @PutMapping("/profile")
    public Map<String, Object> updateProfile(
            @RequestBody Map<String, Object> updatedProfile) {

        if (updatedProfile.containsKey("name")) {

            profile.put(
                    "name",
                    updatedProfile.get("name")
            );

        }

        return profile;
    }
}