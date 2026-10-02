const API_URL = "http://localhost:3000/api/expenses";

const expenseForm =
    document.getElementById("expenseForm");

const expenseList =
    document.getElementById("expenseList");

const totalExpensesElement =
    document.getElementById("totalExpenses");

const expenseCountElement =
    document.getElementById("expenseCount");

const averageExpenseElement =
    document.getElementById("averageExpense");

const highestExpenseElement =
    document.getElementById("highestExpense");

const emptyMessage =
    document.getElementById("emptyMessage");

const filterCategory =
    document.getElementById("filterCategory");

const searchExpense =
    document.getElementById("searchExpense");

const exportButton =
    document.getElementById("exportButton");

const themeButton =
    document.getElementById("themeButton");

const formTitle =
    document.getElementById("formTitle");

const submitButton =
    document.getElementById("submitButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

let editingExpenseId = null;


// Category chart
const chartCanvas =
    document.getElementById("expenseChart");

let expenseChart = null;


// Monthly chart
const monthlyChartCanvas =
    document.getElementById("monthlyChart");

let monthlyChart = null;


// Store expenses loaded from backend
let expenses = [];


// Load saved theme
const savedTheme =
    localStorage.getItem("theme");


if (savedTheme === "dark") {

    document.body.classList.add(
        "dark-mode"
    );

    themeButton.textContent =
        "☀️ Light Mode";

} else {

    themeButton.textContent =
        "🌙 Dark Mode";
}


// Load expenses from backend
loadExpenses();


// Theme button
themeButton.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "dark-mode"
        );

        const darkMode =
            document.body.classList.contains(
                "dark-mode"
            );

        if (darkMode) {

            themeButton.textContent =
                "☀️ Light Mode";

            localStorage.setItem(
                "theme",
                "dark"
            );

        } else {

            themeButton.textContent =
                "🌙 Dark Mode";

            localStorage.setItem(
                "theme",
                "light"
            );

        }

        displayExpenses();

    }
);


// Load expenses from API
async function loadExpenses() {

    try {

        const response =
            await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                "Failed to load expenses"
            );
        }

        expenses =
            await response.json();

        displayExpenses();

    } catch (error) {

        console.error(
            "Error loading expenses:",
            error
        );

        alert(
            "Could not connect to the backend. Make sure the server is running."
        );

    }

}


// Add or update expense
expenseForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const expenseName =
            document.getElementById(
                "expenseName"
            ).value.trim();

        const amount =
            Number(
                document.getElementById(
                    "amount"
                ).value
            );

        const category =
            document.getElementById(
                "category"
            ).value;

        const date =
            document.getElementById(
                "date"
            ).value;


        if (expenseName === "") {

            alert(
                "Please enter an expense name."
            );

            return;

        }


        if (amount <= 0) {

            alert(
                "Please enter a valid amount."
            );

            return;

        }


        // EDIT MODE
        if (editingExpenseId !== null) {

            try {

                const response =
                    await fetch(
                        API_URL +
                        "/" +
                        editingExpenseId,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name:
                                    expenseName,

                                amount:
                                    amount,

                                category:
                                    category,

                                date:
                                    date
                            })
                        }
                    );


                if (!response.ok) {
                    throw new Error(
                        "Failed to update expense"
                    );
                }


                await loadExpenses();

                cancelEdit();

                return;

            } catch (error) {

                console.error(
                    "Error updating expense:",
                    error
                );

                alert(
                    "Could not update the expense."
                );

                return;

            }

        }


        // ADD MODE
        const expenseData = {

            name:
                expenseName,

            amount:
                amount,

            category:
                category,

            date:
                date

        };


        try {

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                expenseData
                            )
                    }
                );


            if (!response.ok) {
                throw new Error(
                    "Failed to add expense"
                );
            }


            await loadExpenses();

            expenseForm.reset();

        } catch (error) {

            console.error(
                "Error adding expense:",
                error
            );

            alert(
                "Could not add the expense."
            );

        }

    }
);


// Cancel edit
cancelEditButton.addEventListener(
    "click",
    function () {

        cancelEdit();

    }
);


// Category filter
filterCategory.addEventListener(
    "change",
    function () {

        displayExpenses();

    }
);


// Search
searchExpense.addEventListener(
    "input",
    function () {

        displayExpenses();

    }
);


// Export
exportButton.addEventListener(
    "click",
    function () {

        exportExpensesToCSV();

    }
);


// Display expenses
function displayExpenses() {

    expenseList.innerHTML = "";


    const selectedCategory =
        filterCategory.value;


    const searchText =
        searchExpense.value
            .toLowerCase()
            .trim();


    let filteredExpenses =
        expenses;


    // Category filter
    if (
        selectedCategory !== "All"
    ) {

        filteredExpenses =
            filteredExpenses.filter(
                function (expense) {

                    return (
                        expense.category ===
                        selectedCategory
                    );

                }
            );

    }


    // Search filter
    if (
        searchText !== ""
    ) {

        filteredExpenses =
            filteredExpenses.filter(
                function (expense) {

                    const name =
                        expense.name
                            .toLowerCase();

                    const category =
                        expense.category
                            .toLowerCase();


                    return (
                        name.includes(
                            searchText
                        ) ||
                        category.includes(
                            searchText
                        )
                    );

                }
            );

    }


    updateDashboard(
        filteredExpenses
    );


    updateCategoryChart(
        filteredExpenses
    );


    updateMonthlyChart(
        filteredExpenses
    );


    if (
        filteredExpenses.length === 0
    ) {

        emptyMessage.style.display =
            "block";

        return;

    }


    emptyMessage.style.display =
        "none";


    filteredExpenses.forEach(
        function (expense) {

            const row =
                document.createElement(
                    "tr"
                );


            // Name
            const nameCell =
                document.createElement(
                    "td"
                );

            nameCell.textContent =
                expense.name;


            // Amount
            const amountCell =
                document.createElement(
                    "td"
                );

            amountCell.textContent =
                "₹" +
                Number(
                    expense.amount
                ).toFixed(2);


            // Category
            const categoryCell =
                document.createElement(
                    "td"
                );

            categoryCell.textContent =
                expense.category;


            // Date
            const dateCell =
                document.createElement(
                    "td"
                );

            dateCell.textContent =
                expense.date;


            // Action
            const actionCell =
                document.createElement(
                    "td"
                );


            // Edit button
            const editButton =
                document.createElement(
                    "button"
                );

            editButton.className =
                "btn btn-warning btn-sm edit-button";

            editButton.textContent =
                "Edit";


            editButton.addEventListener(
                "click",
                function () {

                    editExpense(
                        expense.id
                    );

                }
            );


            // Delete button
            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.className =
                "btn btn-danger btn-sm";

            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                function () {

                    deleteExpense(
                        expense.id
                    );

                }
            );


            actionCell.appendChild(
                editButton
            );

            actionCell.appendChild(
                deleteButton
            );


            row.appendChild(
                nameCell
            );

            row.appendChild(
                amountCell
            );

            row.appendChild(
                categoryCell
            );

            row.appendChild(
                dateCell
            );

            row.appendChild(
                actionCell
            );


            expenseList.appendChild(
                row
            );

        }
    );

}


// Start editing
function editExpense(id) {

    const expense =
        expenses.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!expense) {

        return;

    }


    editingExpenseId =
        id;


    // Put values into form
    document.getElementById(
        "expenseName"
    ).value =
        expense.name;


    document.getElementById(
        "amount"
    ).value =
        expense.amount;


    document.getElementById(
        "category"
    ).value =
        expense.category;


    document.getElementById(
        "date"
    ).value =
        expense.date;


    // Change form appearance
    formTitle.textContent =
        "Edit Expense";


    submitButton.textContent =
        "Update Expense";


    submitButton.classList.remove(
        "btn-primary"
    );

    submitButton.classList.add(
        "btn-success"
    );


    cancelEditButton.style.display =
        "block";


    // Scroll to form
    expenseForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// Cancel edit
function cancelEdit() {

    editingExpenseId =
        null;


    expenseForm.reset();


    formTitle.textContent =
        "Add Expense";


    submitButton.textContent =
        "Add Expense";


    submitButton.classList.remove(
        "btn-success"
    );

    submitButton.classList.add(
        "btn-primary"
    );


    cancelEditButton.style.display =
        "none";

}


// Dashboard
function updateDashboard(
    filteredExpenses
) {

    const expenseCount =
        filteredExpenses.length;


    expenseCountElement.textContent =
        expenseCount;


    if (
        expenseCount === 0
    ) {

        totalExpensesElement.textContent =
            "₹0.00";

        averageExpenseElement.textContent =
            "₹0.00";

        highestExpenseElement.textContent =
            "₹0.00";

        return;

    }


    let total = 0;


    filteredExpenses.forEach(
        function (expense) {

            total =
                total +
                Number(
                    expense.amount
                );

        }
    );


    const average =
        total /
        expenseCount;


    let highest =
        Number(
            filteredExpenses[0].amount
        );


    filteredExpenses.forEach(
        function (expense) {

            const amount =
                Number(
                    expense.amount
                );


            if (
                amount > highest
            ) {

                highest =
                    amount;

            }

        }
    );


    totalExpensesElement.textContent =
        "₹" +
        total.toFixed(2);


    averageExpenseElement.textContent =
        "₹" +
        average.toFixed(2);


    highestExpenseElement.textContent =
        "₹" +
        highest.toFixed(2);

}


// Category chart
function updateCategoryChart(
    filteredExpenses
) {

    const categoryTotals = {

        Food: 0,

        Transport: 0,

        Shopping: 0,

        Bills: 0,

        Entertainment: 0,

        Other: 0

    };


    filteredExpenses.forEach(
        function (expense) {

            if (
                categoryTotals.hasOwnProperty(
                    expense.category
                )
            ) {

                categoryTotals[
                    expense.category
                ] =
                    categoryTotals[
                        expense.category
                    ] +
                    Number(
                        expense.amount
                    );

            }

        }
    );


    const labels = [

        "Food",

        "Transport",

        "Shopping",

        "Bills",

        "Entertainment",

        "Other"

    ];


    const data = [

        categoryTotals.Food,

        categoryTotals.Transport,

        categoryTotals.Shopping,

        categoryTotals.Bills,

        categoryTotals.Entertainment,

        categoryTotals.Other

    ];


    if (
        expenseChart !== null
    ) {

        expenseChart.destroy();

    }


    expenseChart =
        new Chart(
            chartCanvas,
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Expenses",

                            data: data,

                            borderWidth: 1

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                color:
                                    getChartTextColor()

                            }

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            context.label +
                                            ": ₹" +
                                            Number(
                                                context.raw
                                            ).toFixed(2)
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


// Monthly chart
function updateMonthlyChart(
    filteredExpenses
) {

    const monthlyTotals = {};


    filteredExpenses.forEach(
        function (expense) {

            const date =
                new Date(
                    expense.date
                );


            const year =
                date.getFullYear();


            const month =
                date.getMonth();


            const monthKey =
                year +
                "-" +
                month;


            if (
                monthlyTotals[
                    monthKey
                ] === undefined
            ) {

                monthlyTotals[
                    monthKey
                ] = 0;

            }


            monthlyTotals[
                monthKey
            ] =
                monthlyTotals[
                    monthKey
                ] +
                Number(
                    expense.amount
                );

        }
    );


    const sortedMonths =
        Object.keys(
            monthlyTotals
        ).sort(
            function (a, b) {

                return a.localeCompare(b);

            }
        );


    const labels = [];

    const data = [];


    sortedMonths.forEach(
        function (monthKey) {

            const parts =
                monthKey.split("-");


            const year =
                Number(
                    parts[0]
                );


            const month =
                Number(
                    parts[1]
                );


            const date =
                new Date(
                    year,
                    month,
                    1
                );


            const monthName =
                date.toLocaleString(
                    "default",
                    {
                        month: "short"
                    }
                );


            labels.push(
                monthName +
                " " +
                year
            );


            data.push(
                monthlyTotals[
                    monthKey
                ]
            );

        }
    );


    if (
        monthlyChart !== null
    ) {

        monthlyChart.destroy();

    }


    monthlyChart =
        new Chart(
            monthlyChartCanvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Monthly Spending",

                            data: data,

                            borderWidth: 1

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        x: {

                            ticks: {

                                color:
                                    getChartTextColor()

                            }

                        },

                        y: {

                            beginAtZero: true,

                            ticks: {

                                color:
                                    getChartTextColor(),

                                callback:
                                    function (
                                        value
                                    ) {

                                        return (
                                            "₹" +
                                            value
                                        );

                                    }

                            }

                        }

                    },

                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    getChartTextColor()

                            }

                        }

                    }

                }

            }
        );

}


// Chart text color
function getChartTextColor() {

    if (
        document.body.classList.contains(
            "dark-mode"
        )
    ) {

        return "#ffffff";

    }


    return "#212529";

}


// Export CSV
function exportExpensesToCSV() {

    if (
        expenses.length === 0
    ) {

        alert(
            "There are no expenses to export."
        );

        return;

    }


    let csvContent =
        "Expense,Amount,Category,Date\n";


    expenses.forEach(
        function (expense) {

            const name =
                escapeCSVValue(
                    expense.name
                );


            const amount =
                Number(
                    expense.amount
                ).toFixed(2);


            const category =
                escapeCSVValue(
                    expense.category
                );


            const date =
                escapeCSVValue(
                    expense.date
                );


            csvContent =
                csvContent +
                name +
                "," +
                amount +
                "," +
                category +
                "," +
                date +
                "\n";

        }
    );


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.setAttribute(
        "href",
        url
    );


    link.setAttribute(
        "download",
        "expenses.csv"
    );


    link.style.visibility =
        "hidden";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// CSV protection
function escapeCSVValue(
    value
) {

    const text =
        String(value);


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return (
            '"' +
            text.replace(
                /"/g,
                '""'
            ) +
            '"'
        );

    }


    return text;

}


// Delete expense
async function deleteExpense(id) {

    if (
        editingExpenseId === id
    ) {

        cancelEdit();

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this expense?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/" +
                id,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {
            throw new Error(
                "Failed to delete expense"
            );
        }


        await loadExpenses();

    } catch (error) {

        console.error(
            "Error deleting expense:",
            error
        );

        alert(
            "Could not delete the expense."
        );

    }

}