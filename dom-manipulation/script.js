// Simulated server URL
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

// Load quotes from localStorage or use default
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
    {
        text: "The only limit to our realization of tomorrow is our doubts of today.",
        category: "Motivation",
        timestamp: Date.now()
    },
    {
        text: "Life is what happens when you're busy making other plans.",
        category: "Life",
        timestamp: Date.now()
    },
    {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        category: "Success",
        timestamp: Date.now()
    }
];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");
const syncNowBtn = document.getElementById("syncNowBtn");
const notification = document.getElementById("notification");

// Utility: Show temporary notification
function notifyUser(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
    console.log(message);
}

// Save quotes array to localStorage
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Get unique categories
function getUniqueCategories() {
    const categories = new Set();
    quotes.forEach(q => categories.add(q.category));
    return Array.from(categories);
}

// Populate category dropdown
function populateCategories() {
    const selected = localStorage.getItem("selectedCategory") || "all";
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    getUniqueCategories().forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selected) opt.selected = true;
        categoryFilter.appendChild(opt);
    });
}

// Filter and display quote
function filterQuotes() {
    const selected = categoryFilter.value;
    localStorage.setItem("selectedCategory", selected);
    let filtered = quotes;
    if (selected !== "all") {
        filtered = quotes.filter(q => q.category === selected);
    }

    if (filtered.length === 0) {
        quoteDisplay.textContent = "No quotes in this category.";
        return;
    }

    const randIndex = Math.floor(Math.random() * filtered.length);
    const quote = filtered[randIndex];
    quoteDisplay.textContent = `"${quote.text}" - Category: ${quote.category}`;
    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// Load last viewed quote
function loadLastViewedQuote() {
    const lastQuote = JSON.parse(sessionStorage.getItem("lastQuote"));
    if (lastQuote) {
        quoteDisplay.textContent = `"${lastQuote.text}" - Category: ${lastQuote.category}`;
    }
}

// Show random quote
function showRandomQuote() {
    filterQuotes();
}

// Add new quote
async function addQuote() {
    const textInput = document.getElementById("newQuoteText");
    const categoryInput = document.getElementById("newQuoteCategory");

    const newText = textInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (!newText || !newCategory) {
        alert("Please enter both quote and category.");
        return;
    }

    const newQuote = { text: newText, category: newCategory, timestamp: Date.now() };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    await postQuoteToServer(newQuote);

    textInput.value = "";
    categoryInput.value = "";
    alert("Quote added successfully!");
}

// Export quotes to JSON file
function exportQuotes() {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    a.click();
    URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function (e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            if (Array.isArray(importedQuotes)) {
                quotes.push(...importedQuotes);
                saveQuotes();
                populateCategories();
                notifyUser("Quotes imported successfully!");
            } else {
                alert("Invalid file format.");
            }
        } catch (err) {
            alert("Failed to import quotes: " + err.message);
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

// Simulate server sync: fetch and merge quotes
async function fetchServerQuotes() {
    try {
        const response = await fetch(SERVER_URL);
        if (!response.ok) throw new Error('Fetch failed');
        const serverData = await response.json();
        const serverQuotes = serverData.slice(0, 10).map(item => ({
            text: item.title || item.body || "Untitled",
            category: "Server",
            timestamp: Date.now()
        }));
        mergeQuotes(serverQuotes);
    } catch (err) {
        console.error(err);
        notifyUser("Failed to sync with server.");
    }
}

// Merge quotes with conflict resolution (server wins)
function mergeQuotes(serverQuotes) {
    let updated = false;
    serverQuotes.forEach(sq => {
        const index = quotes.findIndex(q => q.text === sq.text);
        if (index === -1) {
            quotes.push(sq);
            updated = true;
        } else if (sq.timestamp > quotes[index].timestamp || sq.category !== quotes[index].category) {
            quotes[index] = sq;
            updated = true;
        }
    });

    if (updated) {
        saveQuotes();
        populateCategories();
        filterQuotes();
        notifyUser("Quotes updated from server.");
    }
}

// Simulate posting quote to server
async function postQuoteToServer(quote) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quote)
        });
        if (!response.ok) throw new Error("Post failed");
        const data = await response.json();
        console.log("Posted to server:", data);
    } catch (err) {
        console.error("Error posting quote:", err);
        notifyUser("Failed to post new quote to server.");
    }
}

// Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
exportBtn.addEventListener("click", exportQuotes);
importFile.addEventListener("change", importFromJsonFile);
syncNowBtn.addEventListener("click", fetchServerQuotes);

// Initialization
loadLastViewedQuote();
populateCategories();
filterQuotes();
setInterval(fetchServerQuotes, 60000); // Auto-sync every 1 min

