const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const PORTAL_URL = "https://malamal32.github.io/SieteMaintenanceV2/";
const PORTAL_ORIGIN = new URL(PORTAL_URL).origin;

function isPdfUrl(url) {
    try {
        return new URL(url).pathname.toLowerCase().endsWith(".pdf");
    } catch (_error) {
        return false;
    }
}

app.setAppUserModelId("com.siete.documentportal");

function createWindow() {
    const window = new BrowserWindow({
        width: 1180,
        height: 800,
        minWidth: 760,
        minHeight: 560,
        title: "Siete Document Portal",
        icon: path.join(__dirname, "build", "icon.ico"),
        autoHideMenuBar: true,
        backgroundColor: "#ffffff",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    window.loadURL(PORTAL_URL);

    window.webContents.setWindowOpenHandler(({ url }) => {
        const target = new URL(url);

        if (isPdfUrl(url)) {
            shell.openExternal(url);
        } else if (target.origin === PORTAL_ORIGIN) {
            window.loadURL(url);
        } else {
            shell.openExternal(url);
        }

        return { action: "deny" };
    });

    window.webContents.on("will-navigate", (event, url) => {
        const target = new URL(url);

        if (isPdfUrl(url) || target.origin !== PORTAL_ORIGIN) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    window.webContents.on(
        "did-fail-load",
        (_event, errorCode, _description, _url, isMainFrame) => {
            if (isMainFrame && errorCode !== -3) {
                window.loadFile(path.join(__dirname, "offline.html"));
            }
        }
    );
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
