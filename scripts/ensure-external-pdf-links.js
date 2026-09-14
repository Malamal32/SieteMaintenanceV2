const fs = require("fs");
const { execFileSync } = require("child_process");

const files = execFileSync("git", ["ls-files", "*.html"], {
    encoding: "utf8"
})
    .split(/\r?\n/)
    .filter(Boolean);

const pdfAnchor = /<a\b([^>]*\bhref\s*=\s*(["'])[^"']*\.pdf(?:[?#][^"']*)?\2[^>]*)>/gi;

let changedFiles = 0;
let changedLinks = 0;

for (const file of files) {
    const original = fs.readFileSync(file, "utf8");

    const updated = original.replace(pdfAnchor, (match, attributes) => {
        let next = attributes;

        if (/\btarget\s*=\s*(["'])[^"']*\1/i.test(next)) {
            next = next.replace(
                /\btarget\s*=\s*(["'])[^"']*\1/i,
                'target="_blank"'
            );
        } else {
            next += ' target="_blank"';
        }

        const relMatch = next.match(/\brel\s*=\s*(["'])([^"']*)\1/i);

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
    });

    if (updated !== original) {
        fs.writeFileSync(file, updated, "utf8");
        changedFiles += 1;
    }
}

console.log(
    `Updated ${changedLinks} PDF links across ${changedFiles} HTML files.`
);
