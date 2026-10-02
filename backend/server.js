require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { Pool, types } = require("pg");

/* ==========================================================================
   Config
   ========================================================================== */

const PORT = Number(process.env.PORT) || 3000;

const CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Other",
];

const MAX_NAME_LENGTH = 100;
const MAX_AMOUNT = 10000000;
const MAX_ID = 2147483647; // Postgres INTEGER limit

// IMPORTANT: by default `pg` turns DATE columns into JS Date objects, which
// are then serialised as timestamps and can shift by a day depending on the
// server's timezone. Return plain "YYYY-MM-DD" strings instead.
types.setTypeParser(1082, (value) => value); // DATE
types.setTypeParser(1700, (value) => parseFloat(value)); // NUMERIC -> number

/* ==========================================================================
   Database
   ========================================================================== */

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

// Prevent an idle-client error from crashing the process
pool.on("error", (error) => {
    console.error("Unexpected database error:", error);
});

/* ==========================================================================
   App + middleware
   ========================================================================== */

const app = express();

// CORS_ORIGIN can be a comma-separated list. If unset, all origins are
// allowed (fine for local development, set it in production).
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : null;

app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "10kb" }));

// Serve the frontend from the same server (put it in ./public)
app.use(express.static(path.join(__dirname, "public")));

// Wraps async route handlers so rejected promises reach the error handler
const asyncHandler = (handler) => (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

/* ==========================================================================
   Validation helpers
   ========================================================================== */

function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    // Rejects impossible dates such as 2025-02-31
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function validateExpense(req, res, next) {
    const body = req.body || {};
    const errors = [];

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const amount = Number(body.amount);
    const category = body.category;
    const date = body.date;

    if (name === "") {
        errors.push("Expense name is required");
    } else if (name.length > MAX_NAME_LENGTH) {
        errors.push(`Expense name must be at most ${MAX_NAME_LENGTH} characters`);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        errors.push("Amount must be a number greater than 0");
    } else if (amount > MAX_AMOUNT) {
        errors.push(`Amount must not exceed ${MAX_AMOUNT}`);
    }

    if (!CATEGORIES.includes(category)) {
        errors.push(`Category must be one of: ${CATEGORIES.join(", ")}`);
    }

    if (!isValidDate(date)) {
        errors.push("Date must be a valid date in YYYY-MM-DD format");
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0], errors });
    }

    // Only the cleaned values are used from here on
    req.expense = {
        name,
        amount: Math.round(amount * 100) / 100, // 2 decimal places
        category,
        date,
    };

    next();
}

function validateId(req, res, next) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0 || id > MAX_ID) {
        return res.status(400).json({ message: "Invalid expense id" });
    }

    req.expenseId = id;
    next();
}

/* ==========================================================================
   Routes
   ========================================================================== */

app.get("/health", asyncHandler(async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
}));

// GET /api/expenses?category=Food&from=2025-01-01&to=2025-01-31
app.get("/api/expenses", asyncHandler(async (req, res) => {
    const { category, from, to } = req.query;
    const conditions = [];
    const values = [];

    if (category !== undefined) {
        if (!CATEGORIES.includes(category)) {
            return res.status(400).json({ message: "Invalid category filter" });
        }
        values.push(category);
        conditions.push(`category = $${values.length}`);
    }

    if (from !== undefined) {
        if (!isValidDate(from)) {
            return res.status(400).json({ message: "'from' must be YYYY-MM-DD" });
        }
        values.push(from);
        conditions.push(`date >= $${values.length}`);
    }

    if (to !== undefined) {
        if (!isValidDate(to)) {
            return res.status(400).json({ message: "'to' must be YYYY-MM-DD" });
        }
        values.push(to);
        conditions.push(`date <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
        `SELECT id, name, amount, category, date
         FROM expenses
         ${where}
         ORDER BY date DESC, id DESC`,
        values
    );

    res.json(result.rows);
}));

app.post("/api/expenses", validateExpense, asyncHandler(async (req, res) => {
    const { name, amount, category, date } = req.expense;

    const result = await pool.query(
        `INSERT INTO expenses (name, amount, category, date)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, amount, category, date`,
        [name, amount, category, date]
    );

    res.status(201).json(result.rows[0]);
}));

app.put("/api/expenses/:id", validateId, validateExpense, asyncHandler(async (req, res) => {
    const { name, amount, category, date } = req.expense;

    const result = await pool.query(
        `UPDATE expenses
         SET name = $1, amount = $2, category = $3, date = $4
         WHERE id = $5
         RETURNING id, name, amount, category, date`,
        [name, amount, category, date, req.expenseId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ message: "Expense not found" });
    }

    res.json(result.rows[0]);
}));

app.delete("/api/expenses/:id", validateId, asyncHandler(async (req, res) => {
    const result = await pool.query(
        "DELETE FROM expenses WHERE id = $1",
        [req.expenseId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ message: "Expense not found" });
    }

    res.status(204).end();
}));

/* ==========================================================================
   Error handling
   ========================================================================== */

// Unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Central error handler (bad JSON, database errors, anything unexpected)
app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body is not valid JSON" });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body is too large" });
    }

    console.error(error);
    res.status(500).json({ message: "Something went wrong on the server" });
});

/* ==========================================================================
   Start + graceful shutdown
   ========================================================================== */

const server = app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    try {
        await pool.query("SELECT 1");
        console.log("Database connection OK");
    } catch (error) {
        console.error("Could not connect to the database:", error.message);
    }
});

function shutdown() {
    console.log("Shutting down...");
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);