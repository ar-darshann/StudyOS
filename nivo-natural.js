/* Nivora: keep learning-style personalization optional and out of the opening exchange. */
(function () {
    const originalDescription = "No setup needed. Just talk to me.";

    function getElements() {
        return {
            messages: document.getElementById("chatMessages"),
            modes: document.getElementById("nivoLearningModes"),
            description: document.getElementById("nivoModeDescription")
        };
    }

    function userMessageCount(messages) {
        return Array.from(messages?.querySelectorAll(".chat-message.user") || []).length;
    }

    function updateLearningStylePrompt() {
        const { messages, modes, description } = getElements();
        if (!messages || !modes) return;

        // A fresh chat should feel like a conversation, not a setup screen.
        if (userMessageCount(messages) < 3) {
            modes.classList.add("hidden");
            if (description && !document.getElementById("nivoModeBadge")?.classList.contains("hidden")) return;
            if (description) description.textContent = originalDescription;
            return;
        }

        // After the conversation has some substance, offer personalization without blocking it.
        if (!document.getElementById("nivoModeBadge")?.classList.contains("hidden")) return;
        modes.classList.remove("hidden");
        if (description) description.textContent = "If you want, you can choose how I teach. Totally optional.";
    }

    function observeChat() {
        const messages = document.getElementById("chatMessages");
        if (!messages) return;
        updateLearningStylePrompt();
        new MutationObserver(updateLearningStylePrompt).observe(messages, { childList: true });
    }

    document.addEventListener("DOMContentLoaded", observeChat);
})();
