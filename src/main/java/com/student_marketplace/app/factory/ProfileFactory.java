package com.student_marketplace.app.factory;

import com.student_marketplace.app.domain.Profile;

    public class ProfileFactory {


        public static Profile createDefaultProfile() {

            return new Profile(

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
        }
    }