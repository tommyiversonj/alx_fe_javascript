// Simulated server URL (replace with your API endpoint)
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

// Load quotes from localStorage or use default
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation", timestamp: Date.now() },
    { text: "Life is what happens when you're busy making other plans.", category: "Life", timestamp: Date.now() },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Success", timestamp: Date.now() },
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

// Utility: Show notification message briefly
function notifyUser(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 4000);
    console.log(message);
}

// Save quotes array to localStorage
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Get unique categories from quotes
function getUniqueCategories() {
    const categories = new Set();
    quotes.forEach(quote => categories.add(quote.category));
    return Array.from(categories);
}

// Populate category dropdown dynamically
function populateCategories() {
    const selected = localStorage.getItem("selectedCategory") || "all";
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    const categories = getUniqueCategories();
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        if (cat === selected) option.selected = true;
        categoryFilter.appendChild(option);
    });
}

// Filter and display quote based on selected category
function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    localStorage.setItem("selectedCategory", selectedCategory);

    let filteredQuotes = quotes;
    if (selectedCategory !== "all") {
        filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }

    if (filteredQuotes.length === 0) {
        quoteDisplay.textContent = "No quotes in this category.";
        return;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    quoteDisplay.textContent = `"${quote.text}" - Category: ${quote.category}`;

    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// Show random quote (respects current filter)
function showRandomQuote() {
    filterQuotes();
}

// Load last viewed quote from sessionStorage
function loadLastViewedQuote() {
    const lastQuote = JSON.parse(sessionStorage.getItem("lastQuote"));
    if (lastQuote) {
        quoteDisplay.textContent = `"${lastQuote.text}" - Category: ${lastQuote.category}`;
    }
}

// Add new quote from user input
async function addQuote() {
    const textInput = document.getElementById("newQuoteText");
    const categoryInput = document.getElementById("newQuoteCategory");

    const newQuote = textInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (!newQuote || !newCategory) {
        alert("Please enter both quote and category.");
        return;
    }

    const quoteObj = { text: newQuote, category: newCategory, timestamp: Date.now() };
    quotes.push(quoteObj);
    saveQuotes();
    populateCategories();

    // Simulate posting to server
    await postQuoteToServer(quoteObj);

    textInput.value = "";
    categoryInput.value = "";
    alert("Quote added successfully!");
}

// Export quotes as JSON file
function exportQuotes() {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    a.click();
    URL.revokeObjectURL(url);
}

// Import quotes from JSON file input
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
                alert("Invalid file format. Expected an array of quotes.");
            }
        } catch (err) {
            alert("Failed to import quotes: " + err.message);
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

// Simulate fetching quotes from server and merging
async function fetchServerQuotes() {
    try {
        const response = await fetch(SERVER_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const serverData = await response.json();

        // Transform server data to quote format (example using JSONPlaceholder posts)
        const serverQuotes = serverData.slice(0, 10).map(item => ({
            text: item.title || item.body || 'Untitled',
            category: "Server",
            timestamp: Date.now()
        }));

        mergeQuotes(serverQuotes);

    } catch (error) {
        console.error('Failed to fetch server quotes:', error);
        notifyUser('Failed to sync with server.');
    }
}

// Merge server quotes into local quotes, server wins conflicts
function mergeQuotes(serverQuotes) {
    let updated = false;

    serverQuotes.forEach(serverQuote => {
        const localIndex = quotes.findIndex(q => q.text === serverQuote.text);

        if (localIndex === -1) {
            quotes.push(serverQuote);
            updated = true;
        } else {
            if (serverQuote.timestamp > quotes[localIndex].timestamp ||
                serverQuote.category !== quotes[localIndex].category) {
                quotes[localIndex] = serverQuote;
                updated = true;
            }
        }
    });

    if (updated) {
        saveQuotes();
        populateCategories();
        filterQuotes();
        notifyUser('Quotes updated from server.');
    }
}

// Simulate posting new quote to server
async function postQuoteToServer(quote) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quote),
        });
        if (!response.ok) throw new Error('Failed to post quote to server');
        const data = await response.json();
        console.log('Quote posted to server:', data);
    } catch (error) {
        console.error('Error posting quote:', error);
        notifyUser('Failed to post new quote to server.');
    }
}

// Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
exportBtn.addEventListener("click", exportQuotes);
importFile.addEventListener("change", importFromJsonFile);
syncNowBtn.addEventListener("click", fetchServerQuotes);

// Initialization on page load
loadLastViewedQuote();
populateCategories();
filterQuotes();

// Periodic sync every 60 seconds
setInterval(fetchServerQuotes, 60000);
