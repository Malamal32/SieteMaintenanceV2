(() => {
    const installButton = document.getElementById("pwaInstallButton");
    let installPrompt = null;

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/SieteMaintenanceV2/service-worker.js", {
                scope: "/SieteMaintenanceV2/"
            }).catch(error => {
                console.warn("Service worker registration failed:", error);
            });
        });
    }

    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        installPrompt = event;

        if (installButton) {
            installButton.hidden = false;
        }
    });

    if (installButton) {
        installButton.addEventListener("click", async () => {
            if (!installPrompt) {
                return;
            }

            installPrompt.prompt();
            await installPrompt.userChoice;
            installPrompt = null;
            installButton.hidden = true;
        });
    }

    document.addEventListener("click", event => {
        const link = event.target.closest("a[href]");

        if (!link) {
            return;
        }

        try {
            const target = new URL(link.href, window.location.href);

            if (
                target.origin === window.location.origin &&
                target.pathname.toLowerCase().endsWith(".pdf")
            ) {
                event.preventDefault();

                const viewer = new URL(
                    "/SieteMaintenanceV2/pdf-viewer.html",
                    window.location.origin
                );

                viewer.searchParams.set("file", target.href);
                viewer.searchParams.set("return", window.location.href);
                window.location.href = viewer.href;
            }
        } catch (_error) {
            // Leave malformed or nonstandard links to the browser.
        }
    }, true);

    window.addEventListener("appinstalled", () => {
        installPrompt = null;

        if (installButton) {
            installButton.hidden = true;
        }
    });
})();
