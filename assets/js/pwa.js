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

    window.addEventListener("appinstalled", () => {
        installPrompt = null;

        if (installButton) {
            installButton.hidden = true;
        }
    });
})();
