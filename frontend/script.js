
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


// Category chart
const chartCanvas =
    document.getElementById("expenseChart");

let expenseChart = null;


// Monthly chart
const monthlyChartCanvas =
    document.getElementById("monthlyChart");

let monthlyChart = null;


// Load expenses from localStorage
let expenses =
    JSON.parse(localStorage.getItem("expenses")) || [];


// Display expenses when page loads
displayExpenses();


// Add Expense
expenseForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const expenseName =
        document.getElementById("expenseName").value;

    const amount =
        Number(document.getElementById("amount").value);

    const category =
        document.getElementById("category").value;

    const date =
        document.getElementById("date").value;


    const expense = {

        id: Date.now(),

        name: expenseName,

        amount: amount,

        category: category,

        date: date

    };


    // Add expense
    expenses.push(expense);


    // Save expenses
    saveExpenses();


    // Update display
    displayExpenses();


    // Clear form
    expenseForm.reset();

});


// Filter by category
filterCategory.addEventListener("change", function () {

    displayExpenses();

});


// Search expenses
searchExpense.addEventListener("input", function () {

    displayExpenses();

});


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


    // Start with all expenses
    let filteredExpenses =
        expenses;


    // Filter by category
    if (selectedCategory !== "All") {

        filteredExpenses =
            filteredExpenses.filter(
                function (expense) {

                    return expense.category === selectedCategory;

                }
            );

    }


    // Filter by search text
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


    // Update dashboard
    updateDashboard(filteredExpenses);


    // Update category chart
    updateCategoryChart(filteredExpenses);


    // Update monthly chart
    updateMonthlyChart(filteredExpenses);


    // No results
    if (filteredExpenses.length === 0) {

        emptyMessage.style.display = "block";

        return;

    }


    emptyMessage.style.display = "none";


    // Display filtered expenses
    filteredExpenses.forEach(function (expense) {

        const row =
            document.createElement("tr");


        // Expense name
        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            expense.name;


        // Amount
        const amountCell =
            document.createElement("td");

        amountCell.textContent =
            "₹" + Number(expense.amount).toFixed(2);


        // Category
        const categoryCell =
            document.createElement("td");

        categoryCell.textContent =
            expense.category;


        // Date
        const dateCell =
            document.createElement("td");

        dateCell.textContent =
            expense.date;


        // Action
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

                deleteExpense(expense.id);

            }
        );


        actionCell.appendChild(
            deleteButton
        );


        // Add cells
        row.appendChild(nameCell);

        row.appendChild(amountCell);

        row.appendChild(categoryCell);

        row.appendChild(dateCell);

        row.appendChild(actionCell);


        // Add row
        expenseList.appendChild(row);

    });

}


// Update dashboard
function updateDashboard(filteredExpenses) {

    // Number of expenses
    const expenseCount =
        filteredExpenses.length;


    expenseCountElement.textContent =
        expenseCount;


    // No expenses
    if (expenseCount === 0) {

        totalExpensesElement.textContent =
            "₹0.00";

        averageExpenseElement.textContent =
            "₹0.00";

        highestExpenseElement.textContent =
            "₹0.00";

        return;

    }


    // Calculate total
    let total = 0;


    filteredExpenses.forEach(
        function (expense) {

            total =
                total + Number(expense.amount);

        }
    );


    // Calculate average
    const average =
        total / expenseCount;


    // Find highest expense
    let highest =
        Number(filteredExpenses[0].amount);


    filteredExpenses.forEach(
        function (expense) {

            const amount =
                Number(expense.amount);


            if (amount > highest) {

                highest = amount;

            }

        }
    );


    // Update dashboard
    totalExpensesElement.textContent =
        "₹" + total.toFixed(2);


    averageExpenseElement.textContent =
        "₹" + average.toFixed(2);


    highestExpenseElement.textContent =
        "₹" + highest.toFixed(2);

}


// Update category chart
function updateCategoryChart(filteredExpenses) {

    const categoryTotals = {

        Food: 0,

        Transport: 0,

        Shopping: 0,

        Bills: 0,

        Entertainment: 0,

        Other: 0

    };


    // Calculate category totals
    filteredExpenses.forEach(
        function (expense) {

            if (
                categoryTotals.hasOwnProperty(
                    expense.category
                )
            ) {

                categoryTotals[expense.category] =
                    categoryTotals[expense.category] +
                    Number(expense.amount);

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


    // Remove old chart
    if (expenseChart !== null) {

        expenseChart.destroy();

    }


    // Create new chart
    expenseChart =
        new Chart(chartCanvas, {

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

                        position: "bottom"

                    },

                    tooltip: {

                        callbacks: {

                            label: function (context) {

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

        });

}


// Update monthly chart
function updateMonthlyChart(filteredExpenses) {

    const monthlyTotals = {};


    // Calculate monthly totals
    filteredExpenses.forEach(
        function (expense) {

            const date =
                new Date(expense.date);


            const year =
                date.getFullYear();


            const month =
                date.getMonth();


            const monthKey =
                year + "-" + month;


            if (
                monthlyTotals[monthKey] === undefined
            ) {

                monthlyTotals[monthKey] = 0;

            }


            monthlyTotals[monthKey] =
                monthlyTotals[monthKey] +
                Number(expense.amount);

        }
    );


    // Sort months
    const sortedMonths =
        Object.keys(monthlyTotals).sort(
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
                new Date(year, month, 1);


            const monthName =
                date.toLocaleString(
                    "default",
                    {
                        month: "short"
                    }
                );


            labels.push(
                monthName + " " + year
            );


            data.push(
                monthlyTotals[monthKey]
            );

        }
    );


    // Remove old chart
    if (monthlyChart !== null) {

        monthlyChart.destroy();

    }


    // Create monthly chart
    monthlyChart =
        new Chart(monthlyChartCanvas, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "Monthly Spending",

                        data: data,

                        borderWidth: 1

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function (value) {

                                return "₹" + value;

                            }

                        }

                    }

                },

                plugins: {

                    legend: {

                        display: true

                    },

                    tooltip: {

                        callbacks: {

                            label: function (context) {

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

        });

}


// Delete expense
function deleteExpense(id) {

    expenses =
        expenses.filter(
            function (expense) {

                return expense.id !== id;

            }
        );


    saveExpenses();

    displayExpenses();

}

