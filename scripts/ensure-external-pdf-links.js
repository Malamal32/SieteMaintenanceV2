const fs = require("fs");
const { execFileSync } = require("child_process");

const SITE_ORIGIN = "https://malamal32.github.io";
const APP_ROOT = "/SieteMaintenanceV2/";
const RAW_ROOT =
    "https://raw.githubusercontent.com/Malamal32/SieteMaintenanceV2/main/";

const files = execFileSync("git", ["ls-files", "*.html"], {
    encoding: "utf8"
})
    .split(/\r?\n/)
    .filter(Boolean);

const pdfAnchor =
    /<a\b([^>]*\bhref\s*=\s*(["'])([^"']*\.pdf(?:[?#][^"']*)?)\2[^>]*)>/gi;

let changedFiles = 0;
let changedLinks = 0;
let movedOutsideApp = 0;

function encodeRepositoryPath(pathname) {
    return pathname
        .split("/")
        .map(segment => {
            try {
                return encodeURIComponent(decodeURIComponent(segment));
            } catch (_error) {
                return encodeURIComponent(segment);
            }
        })
        .join("/");
}

for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    const pagePath = file.replace(/\\/g, "/");
    const pageUrl = new URL(pagePath, `${SITE_ORIGIN}${APP_ROOT}`);

    const updated = original.replace(
        pdfAnchor,
        (match, attributes, _quote, href) => {
            let next = attributes;

            try {
                const pdfUrl = new URL(href, pageUrl);

                if (
                    pdfUrl.origin === SITE_ORIGIN &&
                    pdfUrl.pathname.startsWith(APP_ROOT)
                ) {
                    const repositoryPath = encodeRepositoryPath(
                        pdfUrl.pathname.slice(APP_ROOT.length)
                    );
                    const externalUrl =
                        `${RAW_ROOT}${repositoryPath}${pdfUrl.search}${pdfUrl.hash}`;

                    next = next.replace(
                        /\bhref\s*=\s*(["'])[^"']*\1/i,
                        `href="${externalUrl}"`
                    );
                    movedOutsideApp += 1;
                }
            } catch (_error) {
                // Leave links that cannot be parsed unchanged.
            }

            if (/\btarget\s*=\s*(["'])[^"']*\1/i.test(next)) {
                next = next.replace(
                    /\btarget\s*=\s*(["'])[^"']*\1/i,
                    'target="_blank"'
                );
            } else {
                next += ' target="_blank"';
            }

            const relMatch = next.match(
                /\brel\s*=\s*(["'])([^"']*)\1/i
            );

            if (relMatch) {
                const values = new Set(
                    relMatch[2]
                        .split(/\s+/)
                        .filter(Boolean)
                        .map(value => value.toLowerCase())
                );

                values.add("noopener");
                values.add("noreferrer");

                next = next.replace(
                    relMatch[0],
                    `rel="${Array.from(values).join(" ")}"`
                );
            } else {
                next += ' rel="noopener noreferrer"';
            }

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
    `Updated ${changedLinks} PDF links across ${changedFiles} HTML files.`
);
console.log(
    `Moved ${movedOutsideApp} repository PDFs to GitHub's external document domain.`
);
