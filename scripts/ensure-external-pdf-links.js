const fs = require("fs");
const { execFileSync } = require("child_process");

const SITE_ORIGIN = "https://malamal32.github.io";
const APP_ROOT = "/SieteMaintenanceV2/";

const files = execFileSync("git", ["ls-files", "*.html"], {
    encoding: "utf8"
})
    .split(/\r?\n/)
    .filter(Boolean);

const pdfAnchor =
    /<a\b([^>]*\bhref\s*=\s*(["'])([^"']*\.pdf(?:[?#][^"']*)?)\2[^>]*)>/gi;

let changedFiles = 0;
let changedLinks = 0;

for (const file of files) {
    if (file === "pdf-viewer.html") {
        continue;
    }

    const original = fs.readFileSync(file, "utf8");
    const pagePath = file.replace(/\\/g, "/");
    const pageUrl = new URL(pagePath, `${SITE_ORIGIN}${APP_ROOT}`);

    const updated = original.replace(
        pdfAnchor,
        (match, attributes, _quote, href) => {
            let pdfUrl;

            try {
                pdfUrl = new URL(href, pageUrl);
            } catch (_error) {
                return match;
            }

            if (
                pdfUrl.origin !== SITE_ORIGIN ||
                !pdfUrl.pathname.startsWith(APP_ROOT)
            ) {
                return match;
            }

            const viewerUrl = new URL(
                `${APP_ROOT}pdf-viewer.html`,
                SITE_ORIGIN
            );

            viewerUrl.searchParams.set("file", pdfUrl.href);
            viewerUrl.searchParams.set("return", pageUrl.href);

            let next = attributes.replace(
                /\bhref\s*=\s*(["'])[^"']*\1/i,
                `href="${viewerUrl.pathname}${viewerUrl.search}"`
            );

            next = next
                .replace(/\s+target\s*=\s*(["'])[^"']*\1/gi, "")
                .replace(/\s+rel\s*=\s*(["'])[^"']*\1/gi, "")
                .replace(/\s+onclick\s*=\s*(["'])[^"']*\1/gi, "");

            const replacement = `<a${next}>`;

            if (replacement !== match) {
                changedLinks += 1;
            }

            return replacement;
        }
    );

    if (updated !== original) {
        fs.writeFileSync(file, updated, "utf8");
        changedFiles += 1;
    }
}

console.log(
    `Routed ${changedLinks} PDF links through the portal viewer across ${changedFiles} HTML files.`
);
