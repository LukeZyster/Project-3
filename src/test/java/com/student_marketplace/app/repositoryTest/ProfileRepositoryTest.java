package com.student_marketplace.app.repositoryTest;

import com.student_marketplace.app.domain.Profile;
import com.student_marketplace.app.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ProfileRepositoryTest {

    private ProfileRepository profileRepository;

    @BeforeEach
    void setUp() {

        profileRepository =
                new ProfileRepository();
    }

    @Test
    void shouldFindAllProfiles() {

        List<Profile> profiles =
                profileRepository.findAll();

        assertNotNull(profiles);
        assertFalse(profiles.isEmpty());
    }

    @Test
    void shouldFindProfileById() {

        Optional<Profile> profile =
                profileRepository.findById(1L);

        assertTrue(profile.isPresent());

        assertEquals(
                "Lerato Dlamini",
                profile.get().getName()
        );
    }

    @Test
    void shouldReturnEmptyWhenProfileDoesNotExist() {

        Optional<Profile> profile =
                profileRepository.findById(999L);

        assertFalse(profile.isPresent());
    }

    @Test
    void shouldSaveUpdatedProfile() {

        Profile profile =
                profileRepository
                        .findById(1L)
                        .orElseThrow();

        profile.setName("Updated Name");

        Profile savedProfile =
                profileRepository.save(profile);

        assertEquals(
                "Updated Name",
                savedProfile.getName()
        );

        Profile retrievedProfile =
                profileRepository
                        .findById(1L)
                        .orElseThrow();

        assertEquals(
                "Updated Name",
                retrievedProfile.getName()
        );
    }
}