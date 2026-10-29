document.addEventListener("DOMContentLoaded", function () {

    console.log("Profile page loaded.");

    loadProfile();

});


/*
===========================================
LOAD PROFILE FROM SPRING BOOT
===========================================
*/

async function loadProfile() {

    try {

        const response = await fetch("/api/profile");

        if (!response.ok) {

            throw new Error(
                "Could not load profile"
            );

        }

        const profile = await response.json();

        document.getElementById(
            "studentName"
        ).textContent = profile.name;


        console.log(
            "Profile loaded:",
            profile
        );

    }

    catch (error) {

        console.error(
            "Error loading profile:",
            error
        );

    }

}


/*
===========================================
EDIT PROFILE
===========================================
*/

function editProfile() {

    const nameElement =
        document.getElementById("studentName");

    const currentName =
        nameElement.textContent;


    const newName =
        prompt(
            "Enter your name:",
            currentName
        );


    if (
        newName &&
        newName.trim() !== ""
    ) {

        nameElement.textContent =
            newName.trim();

    }

}


/*
===========================================
SAVE PROFILE
===========================================
*/

async function saveProfile() {

    const name =
        document.getElementById(
            "studentName"
        ).textContent;


    try {

        const response = await fetch(
            "/api/profile",
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name: name
                })
            }
        );


        if (!response.ok) {

            throw new Error(
                "Could not save profile"
            );

        }


        alert(
            "Profile saved successfully!"
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "There was a problem saving your profile."
        );

    }

}