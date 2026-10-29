/* =========================================
   ANNOUNCEMENTS DATA
========================================= */

const announcements = [
    {
        title: "New CPUT March Drop!",
        description:
            "The latest official university hoodies and caps have arrived at the campus store. Student discounts available.",
        time: "2 hours ago",
        category: "campus",
        icon: "📢",
        iconClass: "navy-icon"
    },

    {
        title: "Mid-Year Study Materials Drive",
        description:
            "Donate or find affordable second-hand textbooks and equipment for the upcoming finals at the main campus.",
        time: "Yesterday",
        category: "campus",
        icon: "🎓",
        iconClass: "blue-icon"
    }
];


/* =========================================
   DOM ELEMENTS
========================================= */

const announcementList =
    document.getElementById("announcementList");

const searchInput =
    document.getElementById("searchAnnouncement");

const noAnnouncements =
    document.getElementById("noAnnouncements");

const categoryButtons =
    document.querySelectorAll(".category");


/* =========================================
   CURRENT CATEGORY
========================================= */

let currentCategory = "all";


/* =========================================
   DISPLAY ANNOUNCEMENTS
========================================= */

function displayAnnouncements(list) {

    announcementList.innerHTML = "";

    if (list.length === 0) {

        noAnnouncements.style.display = "block";

        return;
    }

    noAnnouncements.style.display = "none";


    list.forEach(function (announcement) {

        const card = document.createElement("article");

        card.classList.add(
            "announcement-card"
        );

        card.dataset.category =
            announcement.category;


        card.innerHTML = `
            <div class="announcement-icon ${announcement.iconClass}">
                ${announcement.icon}
            </div>

            <div class="announcement-info">

                <h3>
                    ${announcement.title}
                </h3>

                <p>
                    ${announcement.description}
                </p>

                <span class="announcement-time">
                    ${announcement.time}
                </span>

            </div>
        `;


        announcementList.appendChild(card);

    });
}


/* =========================================
   FILTER ANNOUNCEMENTS
========================================= */

function filterAnnouncements() {

    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    const filteredAnnouncements =
        announcements.filter(function (announcement) {

            const matchesCategory =
                currentCategory === "all" ||
                announcement.category === currentCategory;


            const matchesSearch =
                announcement.title
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                announcement.description
                    .toLowerCase()
                    .includes(searchTerm);


            return matchesCategory && matchesSearch;

        });


    displayAnnouncements(
        filteredAnnouncements
    );
}


/* =========================================
   SEARCH
========================================= */

searchInput.addEventListener(
    "input",
    function () {

        filterAnnouncements();

    }
);


/* =========================================
   CATEGORY BUTTONS
========================================= */

categoryButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            /*
             * Remove active class
             * from all buttons.
             */

            categoryButtons.forEach(
                function (category) {

                    category.classList.remove(
                        "active"
                    );

                }
            );


            /*
             * Add active class
             * to selected button.
             */

            button.classList.add("active");


            /*
             * Get selected category.
             */

            currentCategory =
                button.dataset.category;


            /*
             * Update announcements.
             */

            filterAnnouncements();

        }
    );

});


/* =========================================
   JOIN EVENT BUTTONS
========================================= */

const eventButtons =
    document.querySelectorAll(
        ".event-button"
    );


eventButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            if (
                button.classList.contains(
                    "remind"
                )
            ) {

                button.textContent =
                    "Reminder Set";

                button.disabled = true;

            } else {

                button.textContent =
                    "Joined";

                button.disabled = true;

            }

        }
    );

});


/* =========================================
   INITIAL DISPLAY
========================================= */

displayAnnouncements(
    announcements
);