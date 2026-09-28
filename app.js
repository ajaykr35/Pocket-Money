let transactions = [];
let goals = [];
let editingTransactionId = null;

let profile = {
  name: "Student",
  course: "B.Tech IT",
  semester: "8th Semester",
};

let budgets = {
  daily: null,
  weekly: null,
  monthly: null,
  yearly: null,
};

const modal = document.getElementById("transactionModal");

const transactionForm = document.getElementById("transactionForm");

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function today() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function saveData() {
  localStorage.setItem("pocketMoneyTransactions", JSON.stringify(transactions));

  localStorage.setItem("pocketMoneyGoals", JSON.stringify(goals));

  localStorage.setItem("pocketMoneyProfile", JSON.stringify(profile));

  localStorage.setItem("pocketMoneyBudgets", JSON.stringify(budgets));
}

function loadData() {
  const savedTransactions = localStorage.getItem("pocketMoneyTransactions");

  const savedGoals = localStorage.getItem("pocketMoneyGoals");

  const savedProfile = localStorage.getItem("pocketMoneyProfile");

  const savedBudgets = localStorage.getItem("pocketMoneyBudgets");

  if (savedTransactions) {
    transactions = JSON.parse(savedTransactions);
  }

  if (savedGoals) {
    goals = JSON.parse(savedGoals);
  }

  if (savedProfile) {
    profile = {
      ...profile,
      ...JSON.parse(savedProfile),
    };
  }

  if (savedBudgets) {
    budgets = {
      ...budgets,
      ...JSON.parse(savedBudgets),
    };
  }
}

function updateProfile() {
  document.getElementById("welcomeName").textContent =
    profile.name || "Student";

  document.getElementById("profileName").value = profile.name || "";

  document.getElementById("profileCourse").value = profile.course || "";

  document.getElementById("profileSemester").value = profile.semester || "";

  document.getElementById("profileButton").textContent = (profile.name || "S")
    .charAt(0)
    .toUpperCase();
}

function getIncome() {
  return transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function getExpense() {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function updateDashboard() {
  const income = getIncome();

  const expense = getExpense();

  const balance = income - expense;

  const savings = income > 0 ? Math.max(0, (balance / income) * 100) : 0;

  document.getElementById("balance").textContent = money(balance);

  document.getElementById("totalIncome").textContent = money(income);

  document.getElementById("totalExpense").textContent = money(expense);

  document.getElementById("savingsRate").textContent = savings.toFixed(0) + "%";
}

function normalizeDate(date) {
  const d = new Date(date);

  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDailyExpense() {
  const currentDate = today();

  return transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && transaction.date === currentDate,
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function getWeeklyExpense() {
  const current = new Date();

  const day = current.getDay();

  const difference = day === 0 ? 6 : day - 1;

  const monday = new Date(current);

  monday.setDate(current.getDate() - difference);

  monday.setHours(0, 0, 0, 0);

  return transactions
    .filter((transaction) => {
      if (transaction.type !== "expense") {
        return false;
      }

      const date = normalizeDate(transaction.date);

      return date >= monday && date <= normalizeDate(current);
    })
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function getMonthlyExpense() {
  const current = new Date();

  return transactions
    .filter((transaction) => {
      if (transaction.type !== "expense") {
        return false;
      }

      const date = normalizeDate(transaction.date);

      return (
        date.getMonth() === current.getMonth() &&
        date.getFullYear() === current.getFullYear()
      );
    })
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function getYearlyExpense() {
  const year = new Date().getFullYear();

  return transactions
    .filter((transaction) => {
      if (transaction.type !== "expense") {
        return false;
      }

      const date = normalizeDate(transaction.date);

      return date.getFullYear() === year;
    })
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function updateBudgetCard(type, spent, limit) {
  const spentElement = document.getElementById(`${type}Spent`);

  const limitElement = document.getElementById(`${type}Budget`);

  const remainingElement = document.getElementById(`${type}Remaining`);

  const progressElement = document.getElementById(`${type}Progress`);

  const statusElement = document.getElementById(`${type}Status`);

  spentElement.textContent = money(spent);

  if (limit === null || limit === undefined) {
    limitElement.textContent = "Not Set";

    remainingElement.textContent = "—";

    progressElement.style.width = "0%";

    statusElement.textContent = "Not Set";

    statusElement.className = "status";

    return;
  }

  const percentage = limit > 0 ? (spent / limit) * 100 : 0;

  limitElement.textContent = money(limit);

  remainingElement.textContent = money(Math.max(0, limit - spent));

  progressElement.style.width = `${Math.min(100, percentage)}%`;

  let status = "Normal";

  let className = "normal";

  if (percentage >= 100) {
    status = "Exceeded";

    className = "exceeded";
  } else if (percentage >= 80) {
    status = "High Spending";

    className = "high";
  } else if (percentage >= 60) {
    status = "Warning";

    className = "warning";
  }

  statusElement.textContent = status;

  statusElement.className = `status ${className}`;
}

function updateBudgets() {
  updateBudgetCard("daily", getDailyExpense(), budgets.daily);

  updateBudgetCard("weekly", getWeeklyExpense(), budgets.weekly);

  updateBudgetCard("monthly", getMonthlyExpense(), budgets.monthly);

  updateBudgetCard("yearly", getYearlyExpense(), budgets.yearly);

  document.getElementById("dailyLimit").value = budgets.daily ?? "";

  document.getElementById("weeklyLimit").value = budgets.weekly ?? "";

  document.getElementById("monthlyLimit").value = budgets.monthly ?? "";

  document.getElementById("yearlyLimit").value = budgets.yearly ?? "";
}

function getCategoryData() {
  const categories = {};

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      categories[transaction.category] =
        (categories[transaction.category] || 0) + Number(transaction.amount);
    });

  return Object.entries(categories)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function displayCategories() {
  const container = document.getElementById("categories");

  const data = getCategoryData();

  if (!data.length) {
    container.innerHTML = `
            <div class="empty">
                <h4>No spending data yet</h4>
                <p>
                    Add an expense to see category analysis.
                </p>
            </div>
        `;

    return;
  }

  const maximum = data[0].amount;

  container.innerHTML = data
    .slice(0, 7)
    .map((item) => {
      const percentage = (item.amount / maximum) * 100;

      return `
                    <div class="category">

                        <div class="category-header">

                            <span>
                                ${item.category}
                            </span>

                            <strong>
                                ${money(item.amount)}
                            </strong>

                        </div>

                        <div class="category-track">

                            <div
                                class="category-fill"
                                style="width:${percentage}%"
                            ></div>

                        </div>

                    </div>
                `;
    })
    .join("");
}

function updateInsights() {
  const container = document.getElementById("insights");

  const messages = [];

  const hasBudget = Object.values(budgets).some(
    (value) => value !== null && value !== undefined,
  );

  if (!hasBudget) {
    messages.push(
      "Set a daily, weekly, monthly or yearly budget to receive spending alerts.",
    );
  }

  const income = getIncome();

  const expense = getExpense();

  if (income > 0 && expense > income) {
    messages.push("Your expenses are currently higher than your total income.");
  }

  if (income > 0 && expense <= income) {
    messages.push(
      "Your income is higher than your expenses. Keep building your savings.",
    );
  }

  const categories = getCategoryData();

  if (categories.length) {
    messages.push(
      `${categories[0].category} is your highest spending category at ${money(categories[0].amount)}.`,
    );
  }

  if (
    budgets.monthly !== null &&
    budgets.monthly !== undefined &&
    budgets.monthly > 0
  ) {
    const percentage = (getMonthlyExpense() / budgets.monthly) * 100;

    if (percentage >= 80) {
      messages.push("You have crossed 80% of your monthly budget.");
    }
  }

  if (!messages.length) {
    messages.push(
      "Add transactions to receive personalized financial insights.",
    );
  }

  container.innerHTML = messages
    .slice(0, 4)
    .map(
      (message) => `
                    <div class="insight">

                        <div class="insight-icon">
                            ✦
                        </div>

                        <p>
                            ${message}
                        </p>

                    </div>
                `,
    )
    .join("");
}

function updateHealth() {
  const budgetData = [
    ["daily", getDailyExpense()],
    ["weekly", getWeeklyExpense()],
    ["monthly", getMonthlyExpense()],
    ["yearly", getYearlyExpense()],
  ].filter(([type]) => budgets[type] !== null && budgets[type] > 0);

  let score = 0;

  if (budgetData.length) {
    const usage =
      budgetData.reduce(
        (total, [type, spent]) =>
          total + Math.min(100, (spent / budgets[type]) * 100),
        0,
      ) / budgetData.length;

    score = Math.round(100 - usage);
  } else {
    const income = getIncome();

    const expense = getExpense();

    if (income > 0) {
      score = Math.max(
        0,
        Math.min(100, Math.round(((income - expense) / income) * 100)),
      );
    }
  }

  document.getElementById("healthScore").textContent = score;

  document.documentElement.style.setProperty(
    "--health-progress",
    `${score * 3.6}deg`,
  );

  let message =
    "Add transactions and budgets to calculate your spending health.";

  if (score >= 80) {
    message = "Your spending is well controlled. Keep maintaining this habit.";
  } else if (score >= 60) {
    message = "Your spending is moderate. Keep an eye on larger expenses.";
  } else if (score >= 40) {
    message = "Your spending is getting high. Consider reviewing your budget.";
  } else if (score > 0) {
    message =
      "Your current spending is high compared with your available budget.";
  }

  document.getElementById("healthText").textContent = message;
}

/* CHART */

function getWeeklyData() {
  const result = [];

  const current = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(current);

    date.setDate(current.getDate() - i);

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;

    result.push({
      label: date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),

      income: transactions
        .filter(
          (transaction) =>
            transaction.type === "income" && transaction.date === key,
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),

      expense: transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" && transaction.date === key,
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    });
  }

  return result;
}

function getMonthlyData() {
  const result = [];

  const current = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(current.getFullYear(), current.getMonth() - i, 1);

    result.push({
      label: date.toLocaleDateString("en-IN", {
        month: "short",
      }),

      income: transactions
        .filter((transaction) => {
          const d = new Date(transaction.date);

          return (
            transaction.type === "income" &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),

      expense: transactions
        .filter((transaction) => {
          const d = new Date(transaction.date);

          return (
            transaction.type === "expense" &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    });
  }

  return result;
}

function getYearlyData() {
  const result = [];

  const currentYear = new Date().getFullYear();

  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i;

    result.push({
      label: String(year),

      income: transactions
        .filter((transaction) => {
          const d = new Date(transaction.date);

          return transaction.type === "income" && d.getFullYear() === year;
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),

      expense: transactions
        .filter((transaction) => {
          const d = new Date(transaction.date);

          return transaction.type === "expense" && d.getFullYear() === year;
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    });
  }

  return result;
}

function displayChart() {
  const container = document.getElementById("chart");

  const period = document.getElementById("chartPeriod").value;

  let data;

  if (period === "monthly") {
    data = getMonthlyData();
  } else if (period === "yearly") {
    data = getYearlyData();
  } else {
    data = getWeeklyData();
  }

  const maximum = Math.max(
    1,
    ...data.flatMap((item) => [item.income, item.expense]),
  );

  container.innerHTML = data
    .map((item) => {
      const incomeHeight = (item.income / maximum) * 190;

      const expenseHeight = (item.expense / maximum) * 190;

      return `
                    <div class="chart-column">

                        <div class="chart-bars">

                            <div
                                class="bar income-bar"
                                style="height:${Math.max(3, incomeHeight)}px"
                            ></div>

                            <div
                                class="bar expense-bar"
                                style="height:${Math.max(3, expenseHeight)}px"
                            ></div>

                        </div>

                        <div class="chart-label">
                            ${item.label}
                        </div>

                    </div>
                `;
    })
    .join("");
}

/* GOALS */

function displayGoals() {
  const container = document.getElementById("goalsList");

  if (!goals.length) {
    container.innerHTML = `
            <div class="empty">

                <h4>
                    No savings goals yet
                </h4>

                <p>
                    Create a goal like Laptop, Trip or Emergency Fund.
                </p>

            </div>
        `;

    return;
  }

  container.innerHTML = goals
    .map((goal) => {
      const percentage = Math.min(
        100,
        Math.max(0, (goal.saved / goal.target) * 100),
      );

      return `
                    <div class="goal">

                        <div class="goal-header">

                            <span class="goal-name">
                                ${goal.name}
                            </span>

                            <span class="goal-value">
                                ${money(goal.saved)}
                                /
                                ${money(goal.target)}
                            </span>

                        </div>

                        <div class="goal-track">

                            <div
                                class="goal-fill"
                                style="width:${percentage}%"
                            ></div>

                        </div>

                        <div class="goal-footer">

                            <span class="goal-percent">
                                ${percentage.toFixed(0)}% completed
                            </span>

                            <button
                                class="delete-goal"
                                onclick="deleteGoal('${goal.id}')"
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                `;
    })
    .join("");
}

function deleteGoal(id) {
  goals = goals.filter((goal) => goal.id !== id);

  saveData();

  displayGoals();
}

/* TRANSACTIONS */

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function displayTransactions() {
  const container = document.getElementById("transactionList");

  const search = document
    .getElementById("transactionSearch")
    .value.toLowerCase();

  const type = document.getElementById("transactionType").value;

  const category = document.getElementById("transactionCategory").value;

  const filtered = transactions
    .filter((transaction) => {
      return (
        transaction.description.toLowerCase().includes(search) &&
        (type === "all" || transaction.type === type) &&
        (category === "all" || transaction.category === category)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!filtered.length) {
    container.innerHTML = `
            <div class="empty">

                <h4>
                    No transactions found
                </h4>

                <p>
                    Add your first transaction using the button above.
                </p>

            </div>
        `;

    return;
  }

  container.innerHTML = filtered
    .map((transaction) => {
      const isIncome = transaction.type === "income";

      return `
                    <div class="transaction">

                        <div class="transaction-main">

                            <div
                                class="transaction-icon ${
                                  isIncome ? "income" : "expense"
                                }"
                            >
                                ${isIncome ? "↑" : "↓"}
                            </div>

                            <div>

                                <div class="transaction-name">
                                    ${transaction.description}
                                </div>

                                <div class="transaction-date">
                                    ${formatDate(transaction.date)}
                                </div>

                            </div>

                        </div>


                        <div class="transaction-category">
                            ${transaction.category}
                        </div>


                        <div
                            class="transaction-amount ${
                              isIncome ? "income" : "expense"
                            }"
                        >
                            ${isIncome ? "+" : "-"}
                            ${money(transaction.amount)}
                        </div>


                        <div class="transaction-date">
                            ${formatDate(transaction.date)}
                        </div>


                        <div class="transaction-actions">

                            <button
                                class="action-button"
                                onclick="editTransaction('${transaction.id}')"
                            >
                                ✎
                            </button>

                            <button
                                class="action-button"
                                onclick="deleteTransaction('${transaction.id}')"
                            >
                                ×
                            </button>

                        </div>

                    </div>
                `;
    })
    .join("");
}

function openTransactionModal() {
  editingTransactionId = null;

  document.getElementById("transactionModalTitle").textContent =
    "Add Transaction";

  document.getElementById("transactionSubmit").textContent = "Add Transaction";

  transactionForm.reset();

  document.getElementById("transactionDate").value = today();

  modal.classList.add("show");
}

function closeTransactionModal() {
  modal.classList.remove("show");

  editingTransactionId = null;
}

function editTransaction(id) {
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  editingTransactionId = id;

  document.getElementById("transactionModalTitle").textContent =
    "Edit Transaction";

  document.getElementById("transactionSubmit").textContent =
    "Update Transaction";

  document.getElementById("transactionDescription").value =
    transaction.description;

  document.getElementById("transactionAmount").value = transaction.amount;

  document.getElementById("transactionFormType").value = transaction.type;

  document.getElementById("transactionFormCategory").value =
    transaction.category;

  document.getElementById("transactionDate").value = transaction.date;

  modal.classList.add("show");
}

function deleteTransaction(id) {
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  if (!confirm(`Delete "${transaction.description}"?`)) {
    return;
  }

  transactions = transactions.filter((item) => item.id !== id);

  saveData();

  refresh();
}

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = document
    .getElementById("transactionDescription")
    .value.trim();

  const amount = Number(document.getElementById("transactionAmount").value);

  const type = document.getElementById("transactionFormType").value;

  const category = document.getElementById("transactionFormCategory").value;

  const date = document.getElementById("transactionDate").value;

  if (!description || amount <= 0 || !date) {
    return;
  }

  if (editingTransactionId) {
    const transaction = transactions.find(
      (item) => item.id === editingTransactionId,
    );

    if (transaction) {
      transaction.description = description;

      transaction.amount = amount;

      transaction.type = type;

      transaction.category = category;

      transaction.date = date;
    }
  } else {
    transactions.push({
      id: Date.now().toString(),

      description,

      amount,

      type,

      category,

      date,
    });
  }

  saveData();

  closeTransactionModal();

  refresh();
});

/* PROFILE */

document.getElementById("editProfileButton").addEventListener("click", () => {
  const panel = document.getElementById("profilePanel");

  panel.style.display = panel.style.display === "block" ? "none" : "block";
});

document.getElementById("profileButton").addEventListener("click", () => {
  const panel = document.getElementById("profilePanel");

  panel.style.display = "block";

  panel.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
});

document.getElementById("profileForm").addEventListener("submit", (event) => {
  event.preventDefault();

  profile.name =
    document.getElementById("profileName").value.trim() || "Student";

  profile.course =
    document.getElementById("profileCourse").value.trim() || "B.Tech IT";

  profile.semester =
    document.getElementById("profileSemester").value.trim() || "8th Semester";

  saveData();

  updateProfile();

  document.getElementById("profilePanel").style.display = "none";
});

/* BUDGET */

document
  .getElementById("budgetSettingsButton")
  .addEventListener("click", () => {
    const panel = document.getElementById("budgetSettings");

    panel.style.display = panel.style.display === "block" ? "none" : "block";
  });

document.getElementById("budgetForm").addEventListener("submit", (event) => {
  event.preventDefault();

  function value(id) {
    const input = document.getElementById(id).value;

    return input === "" ? null : Number(input);
  }

  budgets = {
    daily: value("dailyLimit"),

    weekly: value("weeklyLimit"),

    monthly: value("monthlyLimit"),

    yearly: value("yearlyLimit"),
  };

  saveData();

  updateBudgets();

  updateInsights();

  updateHealth();

  document.getElementById("budgetSettings").style.display = "none";
});

/* GOALS */

document.getElementById("goalForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("goalName").value.trim();

  const target = Number(document.getElementById("goalTarget").value);

  const saved = Number(document.getElementById("goalSaved").value);

  if (!name || target <= 0 || saved < 0) {
    return;
  }

  goals.push({
    id: Date.now().toString(),

    name,

    target,

    saved,
  });

  saveData();

  displayGoals();

  document.getElementById("goalForm").reset();

  document.getElementById("goalSaved").value = 0;
});

/* FILTERS */

document
  .getElementById("transactionSearch")
  .addEventListener("input", displayTransactions);

document
  .getElementById("transactionType")
  .addEventListener("change", displayTransactions);

document
  .getElementById("transactionCategory")
  .addEventListener("change", displayTransactions);

document.getElementById("chartPeriod").addEventListener("change", displayChart);

/* MODAL */

document
  .getElementById("openTransactionModal")
  .addEventListener("click", openTransactionModal);

document
  .getElementById("closeTransactionModal")
  .addEventListener("click", closeTransactionModal);

document
  .getElementById("cancelTransaction")
  .addEventListener("click", closeTransactionModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeTransactionModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("show")) {
    closeTransactionModal();
  }
});

/* THEME */

function loadTheme() {
  const dark = localStorage.getItem("pocketMoneyDarkMode");

  if (dark === "true") {
    document.body.classList.add("dark");
  }
}

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "pocketMoneyDarkMode",
    document.body.classList.contains("dark"),
  );
});

/* NAVIGATION */

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const href = link.getAttribute("href");

    const target = document.querySelector(href);

    if (!target) {
      return;
    }

    navLinks.forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");

    const top = target.getBoundingClientRect().top + window.scrollY - 88;

    window.scrollTo({
      top,

      behavior: "smooth",
    });
  });
});

/* START */

function refresh() {
  updateProfile();

  updateDashboard();

  updateBudgets();

  updateInsights();

  updateHealth();

  displayCategories();

  displayChart();

  displayGoals();

  displayTransactions();
}

loadData();

loadTheme();

document.getElementById("transactionDate").value = today();

refresh();
