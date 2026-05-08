(function() {
    "use strict";

    const LOGIN_PATH = "/login";
    const SAML_LOGIN_PATH = "/api/saml/login";

    const redirectIfNeeded = () => {
        if (window.location.hostname !== "portal.tid.ac.jp") {
            return;
        }
        if (window.location.pathname !== LOGIN_PATH) {
            return;
        }

        window.location.assign(SAML_LOGIN_PATH);
    };

    const handleUrlChange = () => {
        redirectIfNeeded();
    };

    const wrapHistoryMethod = (methodName) => {
        const originalMethod = window.history[methodName];
        if (typeof originalMethod !== "function") {
            return;
        }

        window.history[methodName] = function(...args) {
            const result = originalMethod.apply(this, args);
            queueMicrotask(handleUrlChange);
            return result;
        };
    };

    wrapHistoryMethod("pushState");
    wrapHistoryMethod("replaceState");

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    if ("navigation" in window && typeof window.navigation.addEventListener === "function") {
        window.navigation.addEventListener("currententrychange", handleUrlChange);
        window.navigation.addEventListener("navigate", () => {
            queueMicrotask(handleUrlChange);
        });
    }

    handleUrlChange();
})();
