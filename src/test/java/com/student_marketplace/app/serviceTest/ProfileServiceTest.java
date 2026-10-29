package com.student_marketplace.app.serviceTest;


import com.student_marketplace.app.domain.Profile;
import com.student_marketplace.app.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfileServiceTest {

    private ProfileRepository profileRepository;
    private ProfileService profileService;

    @BeforeEach
    void setUp() {

        profileRepository =
                mock(ProfileRepository.class);

        profileService =
                new ProfileService(profileRepository);
    }

    @Test
    void shouldGetAllProfiles() {

        Profile profile = new Profile(
                1L,
                "Lerato Dlamini",
                "Computer Science",
                "3rd Year",
                "219045678",
                "Cape Peninsula University of Technology",
                "Informatics & Design",
                "Passionate about technology.",
                5,
                12,
                78,
                3
        );

        when(profileRepository.findAll())
                .thenReturn(List.of(profile));

        List<Profile> profiles =
                profileService.getAllProfiles();

        assertNotNull(profiles);
        assertEquals(1, profiles.size());
        assertEquals(
                "Lerato Dlamini",
                profiles.get(0).getName()
        );

        verify(profileRepository)
                .findAll();
    }

    @Test
    void shouldGetProfileById() {

        Profile profile = new Profile();

        profile.setId(1L);
        profile.setName("Lerato Dlamini");

        when(profileRepository.findById(1L))
                .thenReturn(Optional.of(profile));

        Optional<Profile> result =
                profileService.getProfileById(1L);

        assertTrue(result.isPresent());
        assertEquals(
                "Lerato Dlamini",
                result.get().getName()
        );

        verify(profileRepository)
                .findById(1L);
    }

    @Test
    void shouldReturnEmptyWhenProfileDoesNotExist() {

        when(profileRepository.findById(999L))
                .thenReturn(Optional.empty());

        Optional<Profile> result =
                profileService.getProfileById(999L);

        assertFalse(result.isPresent());

        verify(profileRepository)
                .findById(999L);
    }

    @Test
    void shouldUpdateProfile() {

        Profile profile = new Profile();

        profile.setName("Updated Student");

        when(profileRepository.save(profile))
                .thenReturn(profile);

        Profile result =
                profileService.updateProfile(1L, profile);

        assertEquals(1L, result.getId());

        assertEquals(
                "Updated Student",
                result.getName()
        );

        verify(profileRepository)
                .save(profile);
    }
}
