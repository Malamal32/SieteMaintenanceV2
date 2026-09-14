# Windows desktop app

This folder contains the lightweight Windows wrapper for Siete Document Portal.

The installed app loads the live GitHub Pages site:

https://malamal32.github.io/SieteMaintenanceV2/

That means edits to HTML, CSS, JavaScript, manuals, SOPs, and machine pages on the `main` branch appear in the desktop app automatically. A new Windows build is only needed when files in this `desktop` folder, `logo.png`, or the build workflow change.

GitHub Actions builds the installer and publishes it under the repository's latest Release.
