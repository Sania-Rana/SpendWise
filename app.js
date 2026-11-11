// ==========================================
// SPENDWISE - EXPENSE TRACKER
// ==========================================

// 1. MONTHLY BUDGET

let budgetLimit = 8000;

try {
  const savedBudget = Number(localStorage.getItem("spendwise-budget"));

  if (Number.isFinite(savedBudget) && savedBudget > 0) {
    budgetLimit = savedBudget;
  }
} catch (error) {
  console.error("Could not load saved budget:", error);
}


// 2. DEFAULT TRANSACTIONS

const defaultTransactions = [
  {
    id: 1,
    title: "Canteen lunch",
    category: "Food",
    amount: 250,
    type: "expense",
    date: "Today"
  },
  {
    id: 2,
    title: "Pocket money",
    category: "Income",
    amount: 2000,
    type: "income",
    date: "Today"
  },
  {
    id: 3,
    title: "College travel",
    category: "Travel",
    amount: 100,
    type: "expense",
    date: "Yesterday"
  },
  {
    id: 4,
    title: "Study materials",
    category: "Education",
    amount: 500,
    type: "expense",
    date: "Yesterday"
  }
];

let transactions;

try {
  const savedTransactions = localStorage.getItem("spendwise-transactions");

  transactions = savedTransactions
    ? JSON.parse(savedTransactions)
    : [...defaultTransactions];

  if (!Array.isArray(transactions)) {
    transactions = [...defaultTransactions];
  }
} catch (error) {
  transactions = [...defaultTransactions];
}


// 3. HTML ELEMENTS

const addButton = document.getElementById("add-transaction-btn");
const transactionForm = document.getElementById("transaction-form");
const expenseForm = document.getElementById("expense-form");

const cancelButton = document.getElementById("cancel-transaction");
const cancelFormButton = document.getElementById("cancel-form-btn");

const formMessage = document.getElementById("form-message");

const titleInput = document.getElementById("transaction-title");
const amountInput = document.getElementById("transaction-amount");
const categoryInput = document.getElementById("transaction-category");
const typeInput = document.getElementById("transaction-type");

const searchInput = document.getElementById("transaction-search");
const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");
const sortFilter = document.getElementById("sort-filter");


// 4. FORMAT MONEY

function formatMoney(amount) {
  return Number(amount).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  });
}


// 5. SAVE TRANSACTIONS

function saveTransactions() {
  try {
    localStorage.setItem(
      "spendwise-transactions",
      JSON.stringify(transactions)
    );
  } catch (error) {
    console.error("Could not save transactions:", error);
    formMessage.textContent = "Unable to save data in this browser.";
  }
}


// 6. SHOW AND HIDE FORM

function showForm() {
  transactionForm.hidden = false;
  formMessage.textContent = "";
  titleInput.focus();
}

function hideForm() {
  transactionForm.hidden = true;
  expenseForm.reset();

  delete expenseForm.dataset.editingId;

  document.querySelector("#transaction-form h2").textContent =
    "Add a transaction";

  document.querySelector(
    '#expense-form button[type="submit"]'
  ).textContent = "Save Transaction";

  formMessage.textContent = "";
}

addButton.addEventListener("click", showForm);
cancelButton.addEventListener("click", hideForm);
cancelFormButton.addEventListener("click", hideForm);


// 7. ADD AND EDIT TRANSACTIONS

expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const type = typeInput.value;

  if (!title || !Number.isFinite(amount) || amount <= 0) {
    formMessage.textContent =
      "Please enter a title and a valid amount.";
    return;
  }

  const editingId = expenseForm.dataset.editingId;

  if (editingId) {
    transactions = transactions.map(function (item) {
      if (String(item.id) === editingId) {
        return {
          ...item,
          title: title,
          category: type === "income" ? "Income" : category,
          amount: amount,
          type: type
        };
      }

      return item;
    });

  } else {
    const transaction = {
      id: Date.now(),
      title: title,
      category: type === "income" ? "Income" : category,
      amount: amount,
      type: type,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      })
    };

    transactions.push(transaction);
  }

  saveTransactions();
  hideForm();
  renderDashboard();
});


// 8. CALCULATE TOTALS

function calculateTotals() {
  let income = 0;
  let expenses = 0;

  transactions.forEach(function (transaction) {
    if (transaction.type === "income") {
      income += Number(transaction.amount);
    } else {
      expenses += Number(transaction.amount);
    }
  });

  return {
    income: income,
    expenses: expenses,
    balance: budgetLimit - expenses
  };
}


// 9. RENDER DASHBOARD SUMMARY

function renderSummary() {
  const totals = calculateTotals();

  const spentPercentage =
    (totals.expenses / budgetLimit) * 100;

  const progress = Math.min(spentPercentage, 100);

  document.getElementById("total-income").textContent =
    formatMoney(totals.income);

  document.getElementById("total-expenses").textContent =
    formatMoney(totals.expenses);

  document.getElementById("total-balance").textContent =
    formatMoney(totals.balance);

  document.getElementById("budget-spent").textContent =
    `${formatMoney(totals.expenses)} / ${formatMoney(budgetLimit)}`;

  document.getElementById("budget-progress").style.width =
    `${progress}%`;

  const budgetMessage = document.getElementById("budget-message");

  budgetMessage.className = "";

  if (totals.balance < 0) {

    document.getElementById("budget-remaining").textContent =
      `${formatMoney(Math.abs(totals.balance))} over budget`;

    budgetMessage.textContent =
      "⚠️ Budget exceeded! Review your spending.";

    budgetMessage.classList.add("budget-danger");

  } else {

    document.getElementById("budget-remaining").textContent =
      `${formatMoney(totals.balance)} left in your monthly budget`;

    if (spentPercentage >= 75) {

      budgetMessage.textContent =
        `⚠️ Warning! ${Math.round(spentPercentage)}% of your budget used.`;

      budgetMessage.classList.add("budget-warning");

    } else {

      budgetMessage.textContent =
        `${Math.round(spentPercentage)}% of your budget used. You're on track!`;

      budgetMessage.classList.add("budget-safe");
    }
  }
}


// 10. RENDER TRANSACTIONS WITH FILTERS AND SORTING

function renderTransactions() {

  const list = document.getElementById("transaction-list");

  const resultCount =
    document.getElementById("filter-result-count");

  const searchText = searchInput.value.trim().toLowerCase();

  const selectedCategory = categoryFilter.value;
  const selectedType = typeFilter.value;
  const selectedSort = sortFilter.value;

  // Search and filter transactions

  const filteredTransactions = transactions.filter(function (transaction) {

    const matchesSearch = transaction.title
      .toLowerCase()
      .includes(searchText);

    const matchesCategory =
      selectedCategory === "all" ||
      transaction.category === selectedCategory;

    const matchesType =
      selectedType === "all" ||
      transaction.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // SORT TRANSACTIONS

  filteredTransactions.sort(function (a, b) {

    if (selectedSort === "newest") {
      return Number(b.id) - Number(a.id);
    }

    if (selectedSort === "oldest") {
      return Number(a.id) - Number(b.id);
    }

    if (selectedSort === "high-low") {
      return Number(b.amount) - Number(a.amount);
    }

    if (selectedSort === "low-high") {
      return Number(a.amount) - Number(b.amount);
    }

    return 0;
  });

  list.replaceChildren();

  resultCount.textContent =
    `${filteredTransactions.length} transaction(s) found`;

  if (filteredTransactions.length === 0) {

    list.textContent =
      "No matching transactions found. Try changing your search or filters.";

    return;
  }

  // DISPLAY TRANSACTIONS

  filteredTransactions.forEach(function (transaction) {

    const row = document.createElement("div");
    row.className = "transaction-row";

    const icon = document.createElement("div");
    icon.className = "transaction-icon";

    icon.textContent =
      transaction.type === "income" ? "↓" : "↑";

    const details = document.createElement("div");
    details.className = "transaction-details";

    const title = document.createElement("strong");
    title.textContent = transaction.title;

    const meta = document.createElement("small");

    meta.textContent =
      `${transaction.category} · ${transaction.date}`;

    details.append(title, meta);

    const amount = document.createElement("strong");

    amount.className =
      transaction.type === "income"
        ? "amount-income"
        : "amount-expense";

    const sign =
      transaction.type === "income" ? "+" : "−";

    amount.textContent =
      `${sign}${formatMoney(transaction.amount)}`;


    // EDIT BUTTON

    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "edit-btn";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {

      transactionForm.hidden = false;

      titleInput.value = transaction.title;
      amountInput.value = transaction.amount;

      categoryInput.value =
        transaction.category === "Income"
          ? "Other"
          : transaction.category;

      typeInput.value = transaction.type;

      formMessage.textContent = "";

      expenseForm.dataset.editingId = transaction.id;

      document.querySelector("#transaction-form h2").textContent =
        "Edit transaction";

      expenseForm.querySelector('[type="submit"]').textContent =
        "Update Transaction";

      titleInput.focus();
    });


    // DELETE BUTTON

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {

      const confirmed = confirm(
        `Delete "${transaction.title}" transaction?`
      );

      if (!confirmed) return;

      transactions = transactions.filter(function (item) {
        return item.id !== transaction.id;
      });

      saveTransactions();
      renderDashboard();
    });

    row.append(icon, details, amount, editButton, deleteButton);

    list.appendChild(row);
  });
}


// 11. SEARCH AND FILTER EVENT LISTENERS

searchInput.addEventListener("input", renderTransactions);

categoryFilter.addEventListener("change", renderTransactions);

typeFilter.addEventListener("change", renderTransactions);

sortFilter.addEventListener("change", renderTransactions);


// CLEAR FILTERS BUTTON

document.getElementById("clear-filters")
  .addEventListener("click", function () {

    searchInput.value = "";
    categoryFilter.value = "all";
    typeFilter.value = "all";
    sortFilter.value = "newest";

    renderTransactions();
  });


// 12. CATEGORY-WISE SPENDING INSIGHTS

function renderCategories() {

  const categoryList =
    document.getElementById("category-list");

  categoryList.replaceChildren();

  const categoryTotals = {};

  transactions.forEach(function (transaction) {

    if (transaction.type === "expense") {

      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) +
        Number(transaction.amount);
    }
  });

  const categories = Object.entries(categoryTotals)
    .sort(function (a, b) {
      return b[1] - a[1];
    });

  if (categories.length === 0) {

    categoryList.textContent =
      "Your expense categories will appear here after you add expenses.";

    document.getElementById("spending-insight").textContent =
      "Add an expense to discover your biggest spending category.";

    return;
  }

  const highestAmount = categories[0][1];

  categories.forEach(function ([category, amount]) {

    const item = document.createElement("div");
    item.className = "category-item";

    const heading = document.createElement("div");
    heading.className = "category-heading";

    const name = document.createElement("span");
    name.textContent = category;

    const value = document.createElement("strong");
    value.textContent = formatMoney(amount);

    heading.append(name, value);

    const track = document.createElement("div");
    track.className = "category-track";

    const bar = document.createElement("div");
    bar.className = "category-fill";

    bar.style.width =
      `${(amount / highestAmount) * 100}%`;

    track.appendChild(bar);

    item.append(heading, track);

    categoryList.appendChild(item);
  });

  document.getElementById("spending-insight").textContent =
    `${categories[0][0]} is your highest spending category at ${formatMoney(highestAmount)}.`;
}


// 13. RENDER COMPLETE DASHBOARD

function renderDashboard() {

  renderSummary();

  renderTransactions();

  renderCategories();
}


// 14. DISPLAY TODAY'S DATE

document.getElementById("today-date").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });


// 15. SIDEBAR NAVIGATION

document.querySelectorAll(".nav-link").forEach(function (link) {

  link.addEventListener("click", function () {

    document.querySelectorAll(".nav-link").forEach(function (item) {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});


// 16. MONTHLY BUDGET SETTINGS

const budgetInput =
  document.getElementById("monthly-budget-input");

const saveBudgetButton =
  document.getElementById("save-budget-btn");

const budgetFeedback =
  document.getElementById("budget-feedback");

budgetInput.value = budgetLimit;

saveBudgetButton.addEventListener("click", function () {

  const newBudget = Number(budgetInput.value);

  if (!Number.isFinite(newBudget) || newBudget <= 0) {

    budgetFeedback.textContent =
      "Please enter a budget greater than ₹0.";

    return;
  }

  budgetLimit = newBudget;

  try {

    localStorage.setItem(
      "spendwise-budget",
      String(budgetLimit)
    );

  } catch (error) {

    budgetFeedback.textContent =
      "Budget could not be saved in this browser.";

    return;
  }

  renderDashboard();

  budgetInput.value = budgetLimit;

  budgetFeedback.textContent =
    "Your monthly budget has been updated!";
});


// 17. DARK MODE WITH SAVED PREFERENCE

const themeToggle =
  document.getElementById("theme-toggle");

const savedTheme =
  localStorage.getItem("spendwise-theme");

if (savedTheme === "dark") {

  document.body.classList.add("dark-mode");

  themeToggle.textContent = "☀️ Light Mode";

} else {

  themeToggle.textContent = "🌙 Dark Mode";
}

themeToggle.addEventListener("click", function () {

  document.body.classList.toggle("dark-mode");

  const isDarkMode =
    document.body.classList.contains("dark-mode");

  if (isDarkMode) {

    themeToggle.textContent = "☀️ Light Mode";

    localStorage.setItem("spendwise-theme", "dark");

  } else {

    themeToggle.textContent = "🌙 Dark Mode";

    localStorage.setItem("spendwise-theme", "light");
  }
});


// 18. EXPORT TRANSACTIONS TO CSV

const exportButton =
  document.getElementById("export-csv");

exportButton.addEventListener("click", function () {

  if (transactions.length === 0) {

    alert("No transactions available to export.");

    return;
  }

  const headers = [
    "Title",
    "Category",
    "Amount",
    "Type",
    "Date"
  ];

  const csvRows = transactions.map(function (transaction) {

    return [
      transaction.title,
      transaction.category,
      transaction.amount,
      transaction.type,
      transaction.date

    ].map(function (value) {

      return '"' +
        String(value ?? "").replace(/"/g, '""') +
        '"';

    }).join(",");
  });

  const csvContent =
    [headers.join(","), ...csvRows].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "spendwise-transactions.csv";

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);
});


// 19. INITIAL DASHBOARD LOAD

renderDashboard();