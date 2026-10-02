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


// Category chart
const chartCanvas =
    document.getElementById("expenseChart");

let expenseChart = null;


// Monthly chart
const monthlyChartCanvas =
    document.getElementById("monthlyChart");

let monthlyChart = null;


// Load expenses
let expenses =
    JSON.parse(localStorage.getItem("expenses")) || [];


// Load saved theme
const savedTheme =
    localStorage.getItem("theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

    themeButton.textContent =
        "☀️ Light Mode";

} else {

    themeButton.textContent =
        "🌙 Dark Mode";

}


// Display expenses
displayExpenses();


// Theme button
themeButton.addEventListener(
    "click",
    function () {

        document.body.classList.toggle("dark-mode");


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


        updateChartsForTheme();

    }
);


// Add Expense
expenseForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const expenseName =
            document.getElementById(
                "expenseName"
            ).value;


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


        const expense = {

            id: Date.now(),

            name: expenseName,

            amount: amount,

            category: category,

            date: date

        };


        expenses.push(expense);

        saveExpenses();

        displayExpenses();

        expenseForm.reset();

    }
);


// Filter
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


// Save expenses
function saveExpenses() {

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

}


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
    if (selectedCategory !== "All") {

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
    if (searchText !== "") {

        filteredExpenses =
            filteredExpenses.filter(
                function (expense) {

                    const name =
                        expense.name.toLowerCase();

                    const category =
                        expense.category.toLowerCase();


                    return (
                        name.includes(searchText) ||
                        category.includes(searchText)
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


    if (filteredExpenses.length === 0) {

        emptyMessage.style.display =
            "block";

        return;

    }


    emptyMessage.style.display =
        "none";


    filteredExpenses.forEach(
        function (expense) {

            const row =
                document.createElement("tr");


            const nameCell =
                document.createElement("td");

            nameCell.textContent =
                expense.name;


            const amountCell =
                document.createElement("td");

            amountCell.textContent =
                "₹" +
                Number(
                    expense.amount
                ).toFixed(2);


            const categoryCell =
                document.createElement("td");

            categoryCell.textContent =
                expense.category;


            const dateCell =
                document.createElement("td");

            dateCell.textContent =
                expense.date;


            const actionCell =
                document.createElement("td");


            const deleteButton =
                document.createElement("button");


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


// Dashboard
function updateDashboard(
    filteredExpenses
) {

    const expenseCount =
        filteredExpenses.length;


    expenseCountElement.textContent =
        expenseCount;


    if (expenseCount === 0) {

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
        total / expenseCount;


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


            if (amount > highest) {

                highest = amount;

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


    if (expenseChart !== null) {

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

                            label: "Expenses",

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
                year + "-" + month;


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
                Number(parts[0]);


            const month =
                Number(parts[1]);


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


    if (monthlyChart !== null) {

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

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            "Spent: ₹" +
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


// Update charts after theme change
function updateChartsForTheme() {

    displayExpenses();

}


// Export CSV
function exportExpensesToCSV() {

    if (expenses.length === 0) {

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


// Delete
function deleteExpense(id) {

    expenses =
        expenses.filter(
            function (expense) {

                return (
                    expense.id !== id
                );

            }
        );


    saveExpenses();

    displayExpenses();

}