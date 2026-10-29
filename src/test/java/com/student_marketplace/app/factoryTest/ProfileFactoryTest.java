package com.student_marketplace.app.factoryTest;



import com.student_marketplace.app.domain.Profile;
import com.student_marketplace.app.factory.ProfileFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ProfileFactoryTest {

    @Test
    void shouldCreateDefaultProfile() {

        Profile profile =
                ProfileFactory.createDefaultProfile();

        assertNotNull(profile);

        assertEquals(1L, profile.getId());
        assertEquals(
                "Lerato Dlamini",
                profile.getName()
        );
        assertEquals(
                "Computer Science",
                profile.getCourse()
        );
        assertEquals(
                "3rd Year",
                profile.getYear()
        );
        assertEquals(
                "219045678",
                profile.getStudentId()
        );
    }

    @Test
    void defaultProfileShouldHaveCorrectStatistics() {

        Profile profile =
                ProfileFactory.createDefaultProfile();

        assertEquals(
                5,
                profile.getCoursesEnrolled()
        );

        assertEquals(
                12,
                profile.getAssignments()
        );

        assertEquals(
                78,
                profile.getAverageGrade()
        );

        assertEquals(
                3,
                profile.getUnreadNotifications()
        );
    }
}
