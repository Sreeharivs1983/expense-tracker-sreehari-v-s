const STORAGE_KEY = "expenseTrackerTransactions";

let transactions = [];
let editingTransactionId = null;

const transactionForm = document.getElementById("transaction-form");

const transactionType = document.getElementById("transaction-type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const submitButton = document.getElementById("submit-button");
const errorMessage = document.getElementById("error-message");

const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");

const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");
const currentBalanceElement = document.getElementById("current-balance");

const typeFilter = document.getElementById("type-filter");
const categoryFilter = document.getElementById("category-filter");

const monthlySummaryContent = document.getElementById(
  "monthly-summary-content",
);

function loadTransactions() {
  const storedTransactions = localStorage.getItem(STORAGE_KEY);

  if (storedTransactions) {
    transactions = JSON.parse(storedTransactions);
  } else {
    transactions = [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

transactionForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const type = transactionType.value;
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;
  const description = descriptionInput.value.trim();

  if (!type) {
    showError("Please select a transaction type.");
    return;
  }

  if (!amountInput.value || amount <= 0) {
    showError("Amount must be greater than 0.");
    return;
  }

  if (!category) {
    showError("Please select a category.");
    return;
  }

  if (!date) {
    showError("Please select a date.");
    return;
  }

  if (!description) {
    showError("Please enter a description.");
    return;
  }

  clearError();

  if (editingTransactionId !== null) {
    const transaction = transactions.find(
      (transaction) => transaction.id === editingTransactionId,
    );

    if (transaction) {
      transaction.type = type;
      transaction.amount = amount;
      transaction.category = category;
      transaction.date = date;
      transaction.description = description;
    }

    editingTransactionId = null;

    submitButton.textContent = "Add Transaction";
  } else {
    const newTransaction = {
      id: Date.now(),
      type: type,
      amount: amount,
      category: category,
      date: date,
      description: description,
    };

    transactions.push(newTransaction);
  }

  saveTransactions();

  transactionForm.reset();

  setDefaultDate();

  renderTransactions();

  updateSummary();

  updateMonthlySummary();

  updateExpenseChart();
});

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();

  transactionList.innerHTML = "";

  if (filteredTransactions.length === 0) {
    transactionList.appendChild(emptyMessage);

    emptyMessage.style.display = "block";

    return;
  }

  emptyMessage.style.display = "none";

  filteredTransactions.forEach((transaction) => {
    const transactionItem = document.createElement("div");

    transactionItem.className = "transaction-item";

    const transactionInfo = document.createElement("div");

    transactionInfo.className = "transaction-info";

    const title = document.createElement("h3");

    title.textContent = transaction.category;

    const details = document.createElement("p");

    details.textContent = `${transaction.description} . ${formatDate(transaction.date)}`;

    transactionInfo.appendChild(title);
    transactionInfo.appendChild(details);

    const transactionAmount = document.createElement("div");

    transactionAmount.className = "transaction-amount";

    if (transaction.type === "income") {
      transactionAmount.classList.add("income-amount");

      transactionAmount.textContent = `+ ${formatCurrency(transaction.amount)}`;
    } else {
      transactionAmount.classList.add("expense-amount");

      transactionAmount.textContent = `- ${formatCurrency(transaction.amount)}`;
    }

    const actions = document.createElement("div");

    actions.className = "transaction-actions";

    const editButton = document.createElement("button");

    editButton.className = "edit-button";

    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {
      editTransaction(transaction.id);
    });

    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-button";

    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
      deleteTransaction(transaction.id);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    transactionItem.appendChild(transactionInfo);
    transactionItem.appendChild(transactionAmount);
    transactionItem.appendChild(actions);

    transactionList.appendChild(transactionItem);
  });
}

function updateSummary() {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    }

    if (transaction.type === "expense") {
      totalExpenses += transaction.amount;
    }
  });

  const balance = totalIncome - totalExpenses;

  totalIncomeElement.textContent = formatCurrency(totalIncome);

  totalExpensesElement.textContent = formatCurrency(totalExpenses);

  currentBalanceElement.textContent = formatCurrency(balance);
}

function updateMonthlySummary() {
  const today = new Date();

  const currentYear = today.getFullYear();

  const currentMonth = today.getMonth();

  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date + "T00:00:00");

    const transactionYear = transactionDate.getFullYear();

    const transactionMonth = transactionDate.getMonth();

    if (transactionYear === currentYear && transactionMonth === currentMonth) {
      if (transaction.type === "income") {
        monthlyIncome += transaction.amount;
      }

      if (transaction.type === "expense") {
        monthlyExpenses += transaction.amount;
      }
    }
  });

  const monthlyBalance = monthlyIncome - monthlyExpenses;

  const monthName = today.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  monthlySummaryContent.innerHTML = `

        <div class="monthly-summary-grid">

            <div>
                <span>Month</span>

                <strong>
                    ${monthName}
                </strong>
            </div>

            <div>
                <span>Income</span>

                <strong class="monthly-income">
                    ${formatCurrency(monthlyIncome)}
                </strong>
            </div>

            <div>
                <span>Expenses</span>

                <strong class="monthly-expenses">
                    ${formatCurrency(monthlyExpenses)}
                </strong>
            </div>

            <div>
                <span>Balance</span>

                <strong class="monthly-balance">
                    ${formatCurrency(monthlyBalance)}
                </strong>
            </div>

        </div>
    `;
}

function updateExpenseChart() {
  const categoryTotals = {};

  transactions.forEach((transaction) => {
    if (transaction.type === "expense") {
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = 0;
      }

      categoryTotals[transaction.category] += transaction.amount;
    }
  });

  const chartContainer = document.getElementById("expense-chart");

  chartContainer.innerHTML = "";

  const categories = Object.keys(categoryTotals);

  if (categories.length === 0) {
    const message = document.createElement("p");

    message.className = "chart-empty-message";

    message.textContent = "No expense data available.";

    chartContainer.appendChild(message);

    return;
  }

  const highestAmount = Math.max(...Object.values(categoryTotals));

  categories.forEach((category) => {
    const amount = categoryTotals[category];

    const percentage = (amount / highestAmount) * 100;

    const chartRow = document.createElement("div");

    chartRow.className = "chart-row";

    const label = document.createElement("div");

    label.className = "chart-label";

    const categoryName = document.createElement("span");

    categoryName.className = "chart-category";

    categoryName.textContent = category;

    const categoryAmount = document.createElement("span");

    categoryAmount.className = "chart-amount";

    categoryAmount.textContent = formatCurrency(amount);

    label.appendChild(categoryName);
    label.appendChild(categoryAmount);

    const barBackground = document.createElement("div");

    barBackground.className = "chart-bar-background";

    const bar = document.createElement("div");

    bar.className = "chart-bar";

    bar.style.width = percentage + "%";

    barBackground.appendChild(bar);

    chartRow.appendChild(label);

    chartRow.appendChild(barBackground);

    chartContainer.appendChild(chartRow);
  });
}

function editTransaction(id) {
  const transaction = transactions.find((transaction) => transaction.id === id);

  if (!transaction) {
    return;
  }

  transactionType.value = transaction.type;

  amountInput.value = transaction.amount;

  categoryInput.value = transaction.category;

  dateInput.value = transaction.date;

  descriptionInput.value = transaction.description;

  editingTransactionId = id;

  submitButton.textContent = "Update Transaction";

  document.querySelector(".form-section").scrollIntoView({
    behavior: "smooth",
  });
}

function deleteTransaction(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this transaction?",
  );

  if (!confirmed) {
    return;
  }

  transactions = transactions.filter((transaction) => transaction.id !== id);

  saveTransactions();

  renderTransactions();

  updateSummary();

  updateMonthlySummary();

  updateExpenseChart();
}

function getFilteredTransactions() {
  const selectedType = typeFilter.value;

  const selectedCategory = categoryFilter.value;

  return transactions.filter((transaction) => {
    const matchesType =
      selectedType === "all" || transaction.type === selectedType;

    const matchesCategory =
      selectedCategory === "all" || transaction.category === selectedCategory;

    return matchesType && matchesCategory;
  });
}

typeFilter.addEventListener("change", function () {
  renderTransactions();
});

categoryFilter.addEventListener("change", function () {
  renderTransactions();
});

function formatDate(date) {
  const dateObject = new Date(date + "T00:00:00");

  return dateObject.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = "";
}

function setDefaultDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  dateInput.value = `${year}-${month}-${day}`;
}

function initializeApp() {
  loadTransactions();

  setDefaultDate();

  renderTransactions();

  updateSummary();

  updateMonthlySummary();

  updateExpenseChart();
}

initializeApp();