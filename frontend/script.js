const expenseForm = document.getElementById("expenseForm");

const expenseList = document.getElementById("expenseList");

const totalExpensesElement =
document.getElementById("totalExpenses");

const emptyMessage =
document.getElementById("emptyMessage");

const filterCategory =
document.getElementById("filterCategory");

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

// Filter expenses
filterCategory.addEventListener("change", function () {


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


// Filter expenses
let filteredExpenses = expenses;


if (selectedCategory !== "All") {

    filteredExpenses = expenses.filter(
        function (expense) {

            return expense.category === selectedCategory;

        }
    );

}


// No results
if (filteredExpenses.length === 0) {

    emptyMessage.style.display = "block";

    totalExpensesElement.textContent = "₹0.00";

    return;

}


emptyMessage.style.display = "none";


let total = 0;


// Display filtered expenses
filteredExpenses.forEach(function (expense) {

    total =
        total + Number(expense.amount);


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


// Update total
totalExpensesElement.textContent =
    "₹" + total.toFixed(2);


}

// Delete expense
function deleteExpense(id) {


expenses =
    expenses.filter(function (expense) {

        return expense.id !== id;

    });


saveExpenses();

displayExpenses();


}
