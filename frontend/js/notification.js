// The backend runs on port 8080. If the page is served from somewhere else
// (e.g. Live Server on 5500), call the backend directly.
const API_BASE = window.location.port === "8080" ? "" : "http://localhost:8080";
const API_URL = API_BASE + "/api/notifications";
const CURRENT_USER_ID = "1";
const HEADERS = {
    "Content-Type": "application/json",
    "X-User-Id": CURRENT_USER_ID
};
const TYPE_STYLES = {
    PRICE_DROP:     { tag: "SHOPPING",    icon: "trendDown" },
    NEW_LISTING:    { tag: "LISTINGS",    icon: "tag" },
    OFFER_ACCEPTED: { tag: "MARKETPLACE", icon: "check" },
    MESSAGE:        { tag: "CHAT",        icon: "chat" },
    ANNOUNCEMENT:   { tag: "CAMPUS",      icon: "megaphone" },
    SYSTEM:         { tag: "SYSTEM",      icon: "home" }
};
const ICONS = {
    trendDown: '<polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/>',
    tag:       '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    check:     '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
    chat:      '<path d="M4 5h16v11H9l-5 4z"/>',
    megaphone: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    home:      '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>'
};
let notifications = [];
let statusTimer = null;
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("clearAllButton")
        .addEventListener("click", clearAll);
    document.getElementById("backButton")
        .addEventListener("click", () => history.back());
    loadNotifications();
});
async function loadNotifications() {
    try {
        const response = await fetch(API_URL, { headers: HEADERS });
        if (!response.ok) {
            throw new Error("Could not load notifications");
        }
        notifications = await response.json();
        render();
    } catch (error) {
        console.error(error);
        // Keep this message visible: without it the page would just be blank.
        showStatus("Couldn't load your notifications. Please refresh to try again.", true);
    }
}
function render() {
    const unread = notifications.filter(n => !n.isRead);
    const read = notifications.filter(n => n.isRead);
    fillList("newList", unread);
    fillList("earlierList", read);
    document.getElementById("newSection").hidden = unread.length === 0;
    document.getElementById("earlierSection").hidden = read.length === 0;
    document.getElementById("emptyState").hidden = notifications.length > 0;
    document.getElementById("unreadBadge").textContent = unread.length + " UNREAD";
    document.getElementById("clearAllButton").disabled = notifications.length === 0;
}

function fillList(listId, items) {
    const list = document.getElementById(listId);
    list.replaceChildren(...items.map(buildCard));
}

function buildCard(notification) {
    const template = document.getElementById("notificationTemplate");
    const card = template.content.firstElementChild.cloneNode(true);
    const style = TYPE_STYLES[notification.type] || TYPE_STYLES.SYSTEM;
    card.dataset.id = notification.notificationId;
    card.classList.add(notification.isRead ? "read" : "unread");
    card.querySelector(".card-icon").innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        ICONS[style.icon] + "</svg>";
    card.querySelector(".card-title").textContent = notification.title;
    card.querySelector(".card-message").textContent = notification.message;
    card.querySelector(".card-tag").textContent = style.tag;
    const time = card.querySelector(".card-time");
    time.textContent = timeAgo(notification.createdAt);
    time.dateTime = notification.createdAt;
    const readButton = card.querySelector(".read-button");
    if (notification.isRead) {
        readButton.remove();
    } else {
        readButton.addEventListener("click", event => {
            event.stopPropagation();   // don't also trigger the card click
            markAsRead(notification.notificationId);
        });
    }
    card.querySelector(".delete-button").addEventListener("click", event => {
        event.stopPropagation();
        deleteNotification(notification.notificationId, card);
    });
    if (notification.link) {
        card.classList.add("has-link");
        card.tabIndex = 0;
        card.setAttribute("role", "link");
        const openLink = async () => {
            if (!notification.isRead) {
                await markAsRead(notification.notificationId);
            }
            window.location.href = notification.link;
        };
        card.addEventListener("click", openLink);
        card.addEventListener("keydown", event => {
            // Only react to keys pressed on the card itself, not its buttons
            if (event.key === "Enter" && event.target === card) {
                openLink();
            }
        });
    }
    return card;
}

async function markAsRead(notificationId) {
    try {
        const response = await fetch(API_URL + "/" + notificationId + "/read", {
            method: "PATCH",
            headers: HEADERS
        });
        if (!response.ok) {
            throw new Error("Could not mark as read");
        }
        const updated = await response.json();

        notifications = notifications.map(
            n => n.notificationId === notificationId ? updated : n
        );
        render();
    } catch (error) {
        console.error(error);
        showStatus("Couldn't mark that notification as read.");
    }
}

async function deleteNotification(notificationId, card) {
    // Prevent a second click from sending another DELETE while this one runs
    if (card.classList.contains("removing")) {
        return;
    }
    card.classList.add("removing");
    try {
        const response = await fetch(API_URL + "/" + notificationId, {
            method: "DELETE",
            headers: HEADERS
        });
        if (!response.ok) {
            throw new Error("Could not delete");
        }
        setTimeout(() => {
            notifications = notifications.filter(
                n => n.notificationId !== notificationId
            );
            render();
        }, 200);
    } catch (error) {
        console.error(error);
        card.classList.remove("removing");
        showStatus("Couldn't delete that notification.");
    }
}

async function clearAll() {
    if (!confirm("Delete all notifications? This can't be undone.")) {
        return;
    }
    try {
        const response = await fetch(API_URL, {
            method: "DELETE",
            headers: HEADERS
        });
        if (!response.ok) {
            throw new Error("Could not clear notifications");
        }
        notifications = [];
        render();
    } catch (error) {
        console.error(error);
        showStatus("Couldn't clear your notifications.");
    }
}
function timeAgo(createdAt) {
    if (!createdAt) {
        return "";
    }
    const created = new Date(String(createdAt).replace(/(\.\d{3})\d+/, "$1"));
    if (isNaN(created)) {
        return "";
    }
    const minutes = Math.floor((Date.now() - created) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    if (hours < 48) return "Yesterday";
    return created.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function showStatus(text, persistent = false) {
    const status = document.getElementById("statusMessage");
    status.textContent = text;
    status.hidden = false;
    // Cancel any earlier timer so it can't hide this newer message early
    clearTimeout(statusTimer);
    statusTimer = persistent
        ? null
        : setTimeout(() => { status.hidden = true; }, 4000);
}