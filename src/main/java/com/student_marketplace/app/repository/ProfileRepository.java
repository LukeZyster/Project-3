package com.student_marketplace.app.repository;


import com.student_marketplace.app.domain.Profile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

    public class ProfileRepository {

        private final List<Profile> profiles = new ArrayList<>();


        public ProfileRepository() {

            Profile profile = new Profile(
                    1L,
                    "Lerato Dlamini",
                    "Computer Science",
                    "3rd Year",
                    "219045678",
                    "Cape Peninsula University of Technology",
                    "Informatics & Design",
                    "Passionate about technology and problem solving. " +
                            "I enjoy building innovative solutions and learning " +
                            "new things every day.",
                    5,
                    12,
                    78,
                    3
            );

            profiles.add(profile);
        }


        public List<Profile> findAll() {

            return profiles;
        }


        public Optional<Profile> findById(Long id) {

            return profiles.stream()
                    .filter(profile -> profile.getId().equals(id))
                    .findFirst();
        }


        public Profile save(Profile profile) {

            profiles.removeIf(
                    existingProfile ->
                            existingProfile.getId()
                                    .equals(profile.getId())
            );

            profiles.add(profile);

            return profile;
        }
    }