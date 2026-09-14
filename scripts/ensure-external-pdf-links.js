const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAW_ORIGIN = "https://raw.githubusercontent.com";
const RAW_PREFIX = "/Malamal32/SieteMaintenanceV2/main/";
const OPEN_ACTION =
    "event.preventDefault(); window.open(this.href, '_blank'); return false;";

const files = execFileSync("git", ["ls-files", "*.html"], {
    encoding: "utf8"
})
    .split(/\r?\n/)
    .filter(Boolean);

const pdfAnchor =
    /<a\b([^>]*\bhref\s*=\s*(["'])([^"']*\.pdf(?:[?#][^"']*)?)\2[^>]*)>/gi;

let changedFiles = 0;
let changedLinks = 0;
let restoredLocalLinks = 0;

function decodeRepositoryPath(pathname) {
    return pathname
        .split("/")
        .map(segment => {
            try {
                return decodeURIComponent(segment);
            } catch (_error) {
                return segment;
            }
        })
        .join("/");
}

function encodeRelativePath(pathname) {
    return pathname
        .split("/")
        .map(segment => {
            if (segment === "." || segment === "..") {
                return segment;
            }

            return encodeURIComponent(segment);
        })
        .join("/");
}

for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    const pagePath = file.replace(/\\/g, "/");

    const updated = original.replace(
        pdfAnchor,
        (match, attributes, _quote, href) => {
            let next = attributes;

            try {
                const pdfUrl = new URL(href);

                if (
                    pdfUrl.origin === RAW_ORIGIN &&
                    pdfUrl.pathname.startsWith(RAW_PREFIX)
                ) {
                    const repositoryPath = decodeRepositoryPath(
                        pdfUrl.pathname.slice(RAW_PREFIX.length)
                    );
                    const relativePath = path.posix.relative(
                        path.posix.dirname(pagePath),
                        repositoryPath
                    );
                    const localHref =
                        `${encodeRelativePath(relativePath)}${pdfUrl.search}${pdfUrl.hash}`;

                    next = next.replace(
                        /\bhref\s*=\s*(["'])[^"']*\1/i,
                        `href="${localHref}"`
                    );
                    restoredLocalLinks += 1;
                }
            } catch (_error) {
                // Relative and nonstandard links are already local.
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

            if (/\bonclick\s*=\s*(["'])[^"']*\1/i.test(next)) {
                next = next.replace(
                    /\bonclick\s*=\s*(["'])[^"']*\1/i,
                    `onclick="${OPEN_ACTION}"`
                );
            } else {
                next += ` onclick="${OPEN_ACTION}"`;
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
    `Restored ${restoredLocalLinks} PDFs to the faster GitHub Pages URLs.`
);
