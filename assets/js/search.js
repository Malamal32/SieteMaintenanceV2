document.addEventListener("DOMContentLoaded", async () => {
    const input = document.querySelector("[data-site-search]");
    const results = document.querySelector("[data-search-results]");

    if (!input || !results) return;

    let index = [];

    const normalize = (value = "") =>
        value
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    try {
        const indexUrl = new URL(input.dataset.indexPath, window.location.href);
        indexUrl.searchParams.set("v", "3");

        const response = await fetch(indexUrl.href, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Search index could not be loaded.");
        }

        index = await response.json();
    } catch (error) {
        console.error("Site search error:", error);
        results.innerHTML =
            '<div class="search-empty">Search is not available yet.</div>';
        results.classList.add("active");
        return;
    }

    const getSearchableText = (item) =>
        normalize([
            item.title,
            item.machine,
            item.type,
            item.department,
            ...(item.keywords || [])
        ].filter(Boolean).join(" "));

    const scoreItem = (item, terms, fullQuery) => {
        const title = normalize(item.title);
        const machine = normalize(item.machine);
        const type = normalize(item.type);
        const haystack = getSearchableText(item);

        if (!terms.every(term => haystack.includes(term))) {
            return -1;
        }

        let score = 0;

        // Strongly favor machine names and machine pages.
        if (machine === fullQuery) score += 100;
        if (machine.startsWith(fullQuery)) score += 75;
        if (machine.includes(fullQuery)) score += 55;

        if (title === fullQuery) score += 90;
        if (title.startsWith(fullQuery)) score += 65;
        if (title.includes(fullQuery)) score += 45;

        if (type === "machine page") score += 35;
        if (type === "manual library") score += 15;
        if (type === "sop library") score += 10;

        // Reward each matching search term.
        terms.forEach(term => {
            if (machine.includes(term)) score += 15;
            if (title.includes(term)) score += 12;
            if (haystack.includes(term)) score += 3;
        });

        return score;
    };

    const renderResults = (items) => {
        results.innerHTML = "";

        if (!items.length) {
            results.innerHTML =
                '<div class="search-empty">No matching machine or documentation found.</div>';
            results.classList.add("active");
            return;
        }

        items.slice(0, 15).forEach(({ item }) => {
            const link = document.createElement("a");
            link.className = "search-result";
            link.href = item.url;

            const title = document.createElement("strong");
            title.textContent = item.title;

            const meta = document.createElement("span");
            meta.textContent = [
                item.machine,
                item.type,
                item.department
            ].filter(Boolean).join(" · ");

            link.append(title, meta);
            results.appendChild(link);
        });

        results.classList.add("active");
    };

    const search = () => {
        const fullQuery = normalize(input.value);

        if (fullQuery.length < 2) {
            results.classList.remove("active");
            results.innerHTML = "";
            return;
        }

        const terms = fullQuery.split(" ").filter(Boolean);

        const matches = index
            .map(item => ({
                item,
                score: scoreItem(item, terms, fullQuery)
            }))
            .filter(result => result.score >= 0)
            .sort((a, b) => b.score - a.score);

        renderResults(matches);
    };

    input.addEventListener("input", search);

    const initialQuery =
        new URLSearchParams(window.location.search).get("q") || "";

    if (initialQuery.trim()) {
        input.value = initialQuery;
        search();
    }

    document.addEventListener("click", event => {
        if (!event.target.closest(".search-wrap")) {
            results.classList.remove("active");
        }
    });
});