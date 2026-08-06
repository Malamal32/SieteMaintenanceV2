
document.addEventListener("DOMContentLoaded", async () => {
    const input = document.querySelector("[data-site-search]");
    const results = document.querySelector("[data-search-results]");

    if (!input || !results) {
        return;
    }

    let index = [];

    try {
        const response = await fetch(input.dataset.indexPath);

        if (!response.ok) {
            throw new Error("Search index could not be loaded.");
        }

        index = await response.json();
    } catch (error) {
        results.innerHTML =
            '<div class="search-empty">Search is not available yet.</div>';
        results.classList.add("active");
        return;
    }

    const renderResults = (items) => {
        results.innerHTML = "";

        if (!items.length) {
            results.innerHTML =
                '<div class="search-empty">No matching documentation found.</div>';
            results.classList.add("active");
            return;
        }

        items.slice(0, 12).forEach((item) => {
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
            ]
                .filter(Boolean)
                .join(" · ");

            link.append(title, meta);
            results.appendChild(link);
        });

        results.classList.add("active");
    };

    const search = () => {
        const query = input.value.trim().toLowerCase();

        if (query.length < 2) {
            results.classList.remove("active");
            results.innerHTML = "";
            return;
        }

        const matches = index.filter((item) => {
            const searchableText = [
                item.title,
                item.machine,
                item.type,
                item.department,
                ...(item.keywords || [])
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });

        renderResults(matches);
    };

    input.addEventListener("input", search);

    const initialQuery =
        new URLSearchParams(window.location.search).get("q") || "";

    if (initialQuery.trim()) {
        input.value = initialQuery;
        search();
    }

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".search-wrap")) {
            results.classList.remove("active");
        }
    });
});
