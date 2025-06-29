const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation", timestamp: Date.now() },
  { text: "Life is what happens when you're busy making other plans.", category: "Life", timestamp: Date.now() },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Success", timestamp: Date.now() }
];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");
const syncNowBtn = document.getElementById("syncNowBtn");
const notification = document.getElementById("notification");

// Show notification message
function notifyUser(message) {
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 4000);
  console.log(message);
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Get unique categories for filter dropdown
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
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === selected) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

// Filter and show random quote from selected category
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

// Alias for filterQuotes (per your previous requests)
function displayRandomQuote() {
  filterQuotes();
}

// Load last viewed quote on page load
function loadLastViewedQuote() {
  const lastQuote = JSON.parse(sessionStorage.getItem("lastQuote"));
  if (lastQuote) {
    quoteDisplay.textContent = `"${lastQuote.text}" - Category: ${lastQuote.category}`;
  }
}

// Show random quote (button handler)
function showRandomQuote() {
  filterQuotes();
}

// Add new quote (with POST to server)
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

// Dynamically create the Add Quote form in the DOM
function createAddQuoteForm() {
  const container = document.getElementById("quoteFormContainer");
  container.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;
  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
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

// Fetch quotes from server (mock API)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Failed to fetch quotes from server");
    const serverData = await response.json();
    // Map mock API data to our quote format
    return serverData.slice(0, 10).map(item => ({
      text: item.title || item.body || "Untitled",
      category: "Server",
      timestamp: Date.now()
    }));
  } catch (error) {
    notifyUser("Error fetching quotes from server.");
    console.error(error);
    return [];
  }
}

// Post a new quote to the server (mock API)
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote)
    });
    if (!response.ok) throw new Error("Failed to post quote to server");
    const data = await response.json();
    console.log("Posted quote to server:", data);
  } catch (error) {
    notifyUser("Error posting quote to server.");
    console.error(error);
  }
}

// Sync quotes with the server: fetch, merge, save, notify
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length === 0) {
    notifyUser("No new quotes fetched from server.");
    return;
  }

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
  } else {
    notifyUser("Quotes are already up to date.");
  }
}

// Event listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportQuotes);
importFile.addEventListener("change", importFromJsonFile);
syncNowBtn.addEventListener("click", syncQuotes);

// Initialization
loadLastViewedQuote();
populateCategories();
createAddQuoteForm();
filterQuotes();
setInterval(syncQuotes, 60000); // auto-sync every 60 seconds
