
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

