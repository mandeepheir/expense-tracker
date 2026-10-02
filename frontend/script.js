"use strict";

/* ==========================================================================
   Config
   ========================================================================== */

// If the page is served by the Express server itself, use a relative URL.
// Otherwise (Live Server, file://, etc.) fall back to localhost:3000.
const API_URL =
    window.location.port === "3000"
        ? "/api/expenses"
        : "http://localhost:3000/api/expenses";

// Single source of truth for categories (name -> chart/badge colour)
const CATEGORIES = {
    Food: "#d97706",
    Transport: "#2563eb",
    Shopping: "#db2777",
    Bills: "#dc2626",
    Entertainment: "#7c3aed",
    Other: "#4b5563",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
});

/* ==========================================================================
   DOM references
   ========================================================================== */

const $ = (id) => document.getElementById(id);

const els = {
    form: $("expenseForm"),
    formTitle: $("formTitle"),
    name: $("expenseName"),
    amount: $("amount"),
    category: $("category"),
    date: $("date"),
    submit: $("submitButton"),
    cancelEdit: $("cancelEditButton"),

    list: $("expenseList"),
    empty: $("emptyMessage"),
    loading: $("loadingState"),
    error: $("errorState"),
    retry: $("retryButton"),

    search: $("searchExpense"),
    filterCategory: $("filterCategory"),
    fromDate: $("fromDate"),
    toDate: $("toDate"),
    clearFilters: $("clearFiltersButton"),
    export: $("exportButton"),

    total: $("totalExpenses"),
    count: $("expenseCount"),
    average: $("averageExpense"),
    highest: $("highestExpense"),

    theme: $("themeButton"),
    toasts: $("toastContainer"),
    confirmEl: $("confirmModal"),
    confirmText: $("confirmText"),
    confirmOk: $("confirmOk"),
};

/* ==========================================================================
   State
   ========================================================================== */

let expenses = [];
let editingExpenseId = null;
let sort = { key: "date", dir: "desc" };

let categoryChart = null;
let monthlyChart = null;

const confirmModal = new bootstrap.Modal(els.confirmEl);

/* ==========================================================================
   Helpers
   ========================================================================== */

const formatCurrency = (value) => currencyFormatter.format(Number(value));

// Local "today" as YYYY-MM-DD (toISOString would use UTC and can be a day off)
function todayISO() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

// Parse "YYYY-MM-DD" manually: new Date("YYYY-MM-DD") is UTC and can shift days
function formatDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// Make sure data from the backend has the shape the UI expects
function normalizeExpense(raw) {
    return {
        ...raw,
        amount: Number(raw.amount),
        date: String(raw.date).slice(0, 10), // handles "2025-03-01T00:00:00.000Z"
    };
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    els.theme.textContent = theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
    try {
        localStorage.setItem("theme", theme);
    } catch (e) {
        /* storage unavailable: ignore */
    }
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.setAttribute("role", type === "danger" ? "alert" : "status");

    const wrapper = document.createElement("div");
    wrapper.className = "d-flex";

    const body = document.createElement("div");
    body.className = "toast-body";
    body.textContent = message;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "btn-close btn-close-white me-2 m-auto";
    close.setAttribute("data-bs-dismiss", "toast");
    close.setAttribute("aria-label", "Close");

    wrapper.append(body, close);
    toast.appendChild(wrapper);
    els.toasts.appendChild(toast);

    toast.addEventListener("hidden.bs.toast", () => toast.remove());
    new bootstrap.Toast(toast, { delay: 3500 }).show();
}

function confirmAction(message) {
    return new Promise((resolve) => {
        els.confirmText.textContent = message;
        let confirmed = false;

        const onOk = () => {
            confirmed = true;
            confirmModal.hide();
        };

        els.confirmOk.addEventListener("click", onOk, { once: true });
        els.confirmEl.addEventListener(
            "hidden.bs.modal",
            () => {
                els.confirmOk.removeEventListener("click", onOk);
                resolve(confirmed);
            },
            { once: true }
        );

        confirmModal.show();
    });
}

/* ==========================================================================
   API
   ========================================================================== */

async function apiRequest(path = "", options = {}) {
    const response = await fetch(API_URL + path, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }

    // DELETE may return an empty body
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function loadExpenses() {
    els.loading.classList.remove("d-none");
    els.error.classList.add("d-none");

    try {
        const data = await apiRequest();
        expenses = data.map(normalizeExpense);
        render();
    } catch (error) {
        console.error("Error loading expenses:", error);
        expenses = [];
        render();
        els.error.classList.remove("d-none");
        els.empty.classList.add("d-none");
    } finally {
        els.loading.classList.add("d-none");
    }
}

/* ==========================================================================
   Filtering, sorting
   ========================================================================== */

function getVisibleExpenses() {
    const category = els.filterCategory.value;
    const text = els.search.value.toLowerCase().trim();
    const from = els.fromDate.value;
    const to = els.toDate.value;

    const filtered = expenses.filter((e) => {
        if (category !== "All" && e.category !== category) return false;
        if (from && e.date < from) return false;
        if (to && e.date > to) return false;
        if (
            text &&
            !e.name.toLowerCase().includes(text) &&
            !e.category.toLowerCase().includes(text)
        ) {
            return false;
        }
        return true;
    });

    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;

    return filtered.sort((a, b) => {
        let result;
        if (key === "amount") result = a.amount - b.amount;
        else result = String(a[key]).localeCompare(String(b[key]));

        // Stable tie-breaker so equal values keep a predictable order
        if (result === 0) result = String(a.date).localeCompare(String(b.date));
        return result * factor;
    });
}

function updateSortIndicators() {
    document.querySelectorAll(".sort-button").forEach((button) => {
        const active = button.dataset.sort === sort.key;
        const th = button.closest("th");

        if (active) {
            button.dataset.dir = sort.dir;
            th.setAttribute("aria-sort", sort.dir === "asc" ? "ascending" : "descending");
        } else {
            delete button.dataset.dir;
            th.setAttribute("aria-sort", "none");
        }
    });
}

/* ==========================================================================
   Rendering
   ========================================================================== */

function render() {
    const visible = getVisibleExpenses();

    updateSortIndicators();
    renderDashboard(visible);
    renderTable(visible);
    renderCharts(visible);
}

function renderDashboard(list) {
    els.count.textContent = list.length;

    if (list.length === 0) {
        els.total.textContent = formatCurrency(0);
        els.average.textContent = formatCurrency(0);
        els.highest.textContent = formatCurrency(0);
        return;
    }

    const total = list.reduce((sum, e) => sum + e.amount, 0);
    const highest = Math.max(...list.map((e) => e.amount));

    els.total.textContent = formatCurrency(total);
    els.average.textContent = formatCurrency(total / list.length);
    els.highest.textContent = formatCurrency(highest);
}

function createCell(content) {
    const td = document.createElement("td");
    if (content instanceof Node) td.appendChild(content);
    else td.textContent = content;
    return td;
}

function createActionButton(label, className, ariaLabel, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn btn-sm ${className}`;
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", onClick);
    return button;
}

function renderTable(list) {
    els.list.replaceChildren();
    els.empty.classList.toggle("d-none", list.length > 0 || !els.error.classList.contains("d-none"));

    const rows = list.map((expense) => {
        const row = document.createElement("tr");

        // textContent is used everywhere, so user input can never inject HTML
        const badge = document.createElement("span");
        badge.className = "category-badge";
        badge.textContent = expense.category;
        badge.style.backgroundColor = CATEGORIES[expense.category] || CATEGORIES.Other;

        const actions = createCell("");
        actions.className = "actions-cell";
        actions.append(
            createActionButton("Edit", "btn-outline-warning", `Edit ${expense.name}`, () =>
                startEdit(expense.id)
            ),
            createActionButton("Delete", "btn-outline-danger", `Delete ${expense.name}`, () =>
                deleteExpense(expense.id)
            )
        );

        row.append(
            createCell(expense.name),
            createCell(formatCurrency(expense.amount)),
            createCell(badge),
            createCell(formatDate(expense.date)),
            actions
        );
        return row;
    });

    els.list.append(...rows);
}

/* ---------- Charts ---------- */

function getChartColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
        text: styles.getPropertyValue("--bs-body-color").trim(),
        grid: styles.getPropertyValue("--bs-border-color").trim(),
    };
}

function buildMonthlyData(list) {
    const totals = {};

    list.forEach((e) => {
        // "YYYY-MM" keys sort correctly as plain strings
        const key = e.date.slice(0, 7);
        totals[key] = (totals[key] || 0) + e.amount;
    });

    const keys = Object.keys(totals).sort();

    const labels = keys.map((key) => {
        const [year, month] = key.split("-").map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", {
            month: "short",
        });
        return `${monthName} ${year}`;
    });

    return { labels, data: keys.map((key) => totals[key]) };
}

function renderCharts(list) {
    const colors = getChartColors();

    // --- Category doughnut ---
    const categoryNames = Object.keys(CATEGORIES);
    const categoryData = categoryNames.map((name) =>
        list.filter((e) => e.category === name).reduce((sum, e) => sum + e.amount, 0)
    );

    if (!categoryChart) {
        categoryChart = new Chart(document.getElementById("expenseChart"), {
            type: "doughnut",
            data: {
                labels: categoryNames,
                datasets: [
                    {
                        data: categoryData,
                        backgroundColor: Object.values(CATEGORIES),
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom", labels: { color: colors.text } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}`,
                        },
                    },
                },
            },
        });
    } else {
        categoryChart.data.datasets[0].data = categoryData;
        categoryChart.options.plugins.legend.labels.color = colors.text;
        categoryChart.update();
    }

    // --- Monthly bar chart ---
    const monthly = buildMonthlyData(list);

    if (!monthlyChart) {
        monthlyChart = new Chart(document.getElementById("monthlyChart"), {
            type: "bar",
            data: {
                labels: monthly.labels,
                datasets: [
                    {
                        label: "Monthly spending",
                        data: monthly.data,
                        backgroundColor: "#2563eb",
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: colors.text,
                            callback: (value) => "₹" + Number(value).toLocaleString("en-IN"),
                        },
                        grid: { color: colors.grid },
                    },
                },
                plugins: {
                    legend: { labels: { color: colors.text } },
                    tooltip: {
                        callbacks: { label: (ctx) => formatCurrency(ctx.raw) },
                    },
                },
            },
        });
    } else {
        monthlyChart.data.labels = monthly.labels;
        monthlyChart.data.datasets[0].data = monthly.data;
        monthlyChart.options.scales.x.ticks.color = colors.text;
        monthlyChart.options.scales.x.grid.color = colors.grid;
        monthlyChart.options.scales.y.ticks.color = colors.text;
        monthlyChart.options.scales.y.grid.color = colors.grid;
        monthlyChart.options.plugins.legend.labels.color = colors.text;
        monthlyChart.update();
    }
}

/* ==========================================================================
   Form: add / edit / delete
   ========================================================================== */

function resetForm() {
    els.form.reset();
    els.form.classList.remove("was-validated");
    els.date.value = todayISO();
}

function startEdit(id) {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    editingExpenseId = id;

    els.name.value = expense.name;
    els.amount.value = expense.amount;
    els.category.value = expense.category;
    els.date.value = expense.date;

    els.formTitle.textContent = "Edit expense";
    els.submit.textContent = "Update expense";
    els.submit.classList.replace("btn-primary", "btn-success");
    els.cancelEdit.classList.remove("d-none");

    els.form.scrollIntoView({ behavior: "smooth", block: "center" });
    els.name.focus({ preventScroll: true });
}

function cancelEdit() {
    editingExpenseId = null;
    resetForm();

    els.formTitle.textContent = "Add expense";
    els.submit.textContent = "Add expense";
    els.submit.classList.replace("btn-success", "btn-primary");
    els.cancelEdit.classList.add("d-none");
}

async function handleSubmit(event) {
    event.preventDefault();

    els.name.value = els.name.value.trim();

    if (!els.form.checkValidity()) {
        els.form.classList.add("was-validated");
        return;
    }

    const payload = {
        name: els.name.value,
        amount: Number(els.amount.value),
        category: els.category.value,
        date: els.date.value,
    };

    const isEditing = editingExpenseId !== null;
    els.submit.disabled = true;

    try {
        if (isEditing) {
            await apiRequest(`/${editingExpenseId}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
        } else {
            await apiRequest("", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }

        await loadExpenses();

        if (isEditing) cancelEdit();
        else resetForm();

        showToast(isEditing ? "Expense updated." : "Expense added.");
    } catch (error) {
        console.error("Error saving expense:", error);
        showToast(
            `Couldn't ${isEditing ? "update" : "add"} the expense. Check the server and try again.`,
            "danger"
        );
    } finally {
        els.submit.disabled = false;
    }
}

async function deleteExpense(id) {
    const expense = expenses.find((e) => e.id === id);
    const label = expense ? `"${expense.name}"` : "this expense";

    const confirmed = await confirmAction(`${label} will be permanently removed.`);
    if (!confirmed) return;

    try {
        await apiRequest(`/${id}`, { method: "DELETE" });

        if (editingExpenseId === id) cancelEdit();

        await loadExpenses();
        showToast("Expense deleted.");
    } catch (error) {
        console.error("Error deleting expense:", error);
        showToast("Couldn't delete the expense. Try again.", "danger");
    }
}

/* ==========================================================================
   CSV export (exports what is currently visible)
   ========================================================================== */

function escapeCSVValue(value) {
    let text = String(value);

    // Prevent spreadsheet formula injection (=, +, -, @ at the start of a cell)
    if (/^[=+\-@]/.test(text)) text = "'" + text;

    if (/[",\n]/.test(text)) {
        text = `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function exportExpensesToCSV() {
    const list = getVisibleExpenses();

    if (list.length === 0) {
        showToast("There are no expenses to export.", "warning");
        return;
    }

    const lines = ["Expense,Amount,Category,Date"];
    list.forEach((e) => {
        lines.push(
            [
                escapeCSVValue(e.name),
                e.amount.toFixed(2),
                escapeCSVValue(e.category),
                escapeCSVValue(e.date),
            ].join(",")
        );
    });

    // BOM makes Excel read the file as UTF-8
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/* ==========================================================================
   Init
   ========================================================================== */

function populateCategories() {
    Object.keys(CATEGORIES).forEach((name) => {
        els.category.add(new Option(name, name));
        els.filterCategory.add(new Option(name, name));
    });
}

function clearFilters() {
    els.search.value = "";
    els.filterCategory.value = "All";
    els.fromDate.value = "";
    els.toDate.value = "";
    render();
}

function bindEvents() {
    els.form.addEventListener("submit", handleSubmit);
    els.cancelEdit.addEventListener("click", cancelEdit);
    els.retry.addEventListener("click", loadExpenses);

    els.search.addEventListener("input", render);
    els.filterCategory.addEventListener("change", render);
    els.fromDate.addEventListener("change", render);
    els.toDate.addEventListener("change", render);
    els.clearFilters.addEventListener("click", clearFilters);
    els.export.addEventListener("click", exportExpensesToCSV);

    document.querySelectorAll(".sort-button").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.sort;
            if (sort.key === key) {
                sort.dir = sort.dir === "asc" ? "desc" : "asc";
            } else {
                // Sensible defaults: text A-Z, numbers/dates newest or biggest first
                sort = { key, dir: key === "name" || key === "category" ? "asc" : "desc" };
            }
            render();
        });
    });

    els.theme.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-bs-theme");
        setTheme(current === "dark" ? "light" : "dark");
        render(); // re-colour the charts
    });
}

function init() {
    setTheme(document.documentElement.getAttribute("data-bs-theme") || "light");
    populateCategories();
    els.date.value = todayISO();
    bindEvents();
    loadExpenses();
}

init();