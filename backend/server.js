require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const PORT = 3000;

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

// Middleware
app.use(cors());
app.use(express.json());

// Validate expense data
function validateExpense(req, res, next) {
    const name = req.body.name;
    const amount = Number(req.body.amount);
    const category = req.body.category;
    const date = req.body.date;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Expense name is required"
        });
    }

    if (!amount || amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        });
    }

    if (!category || category.trim() === "") {
        return res.status(400).json({
            message: "Category is required"
        });
    }

    if (!date) {
        return res.status(400).json({
            message: "Date is required"
        });
    }

    next();
}

// Home route
app.get("/", function (req, res) {
    res.send("Expense Tracker Backend is running!");
});

// GET all expenses
app.get("/api/expenses", async function (req, res) {
    try {
        const result = await pool.query(
            "SELECT * FROM expenses ORDER BY date DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to load expenses"
        });
    }
});

// POST expense
app.post("/api/expenses", validateExpense, async function (req, res) {
    try {
        const result = await pool.query(
            "INSERT INTO expenses (name, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING *",
            [
                req.body.name.trim(),
                Number(req.body.amount),
                req.body.category,
                req.body.date
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add expense"
        });
    }
});

// DELETE expense
app.delete("/api/expenses/:id", async function (req, res) {
    try {
        const expenseId = Number(req.params.id);

        const result = await pool.query(
            "DELETE FROM expenses WHERE id = $1 RETURNING *",
            [expenseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json({
            message: "Expense deleted successfully"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete expense"
        });
    }
});

// UPDATE expense
app.put("/api/expenses/:id", validateExpense, async function (req, res) {
    try {
        const expenseId = Number(req.params.id);

        const result = await pool.query(
            "UPDATE expenses SET name = $1, amount = $2, category = $3, date = $4 WHERE id = $5 RETURNING *",
            [
                req.body.name.trim(),
                Number(req.body.amount),
                req.body.category,
                req.body.date,
                expenseId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update expense"
        });
    }
});

// Start server
app.listen(PORT, function () {
    console.log("Server running on http://localhost:" + PORT);
});