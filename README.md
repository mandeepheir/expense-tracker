# Expense Tracker

A full-stack expense tracker for logging daily spending, filtering it, and seeing where the money goes. Built with Node.js, Express and PostgreSQL, with a Bootstrap and Chart.js frontend.





## Features

- Add, edit and delete expenses (full CRUD)
- Dashboard with total, count, average and highest expense
- Doughnut chart of spending by category and bar chart of monthly spending
- Search by name or category, filter by category and date range
- Sortable table columns (newest first by default)
- Export the current view to CSV (Excel-safe, formula-injection protected)
- Light and dark themes, following the system setting on first visit
- Responsive layout, keyboard accessible, with toasts and a delete confirmation dialog
- Server-side validation with proper HTTP status codes

## Tech stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Frontend | HTML, CSS, vanilla JavaScript, Bootstrap 5.3, Chart.js 4 |
| Backend  | Node.js, Express                             |
| Database | PostgreSQL (`pg`)                            |

## Getting started

**Prerequisites:** Node.js 18+ and a running PostgreSQL instance.

```bash
# 1. Install dependencies
npm install

# 2. Configure the environment
cp .env.example .env        # then fill in your database details

# 3. Create the table
psql -U postgres -d expense_tracker -f schema.sql

# 4. Start the server
npm run dev                 # or: npm start
```

Open <http://localhost:3000>.

## Project structure

```
expense-tracker/
├── server.js        Express API + static file server
├── schema.sql       Database schema
├── .env.example     Environment variable template
└── public/
    ├── index.html
    ├── script.js
    └── style.css
```

## API

Base URL: `/api/expenses`

| Method | Endpoint            | Description                                   |
| ------ | ------------------- | --------------------------------------------- |
| GET    | `/api/expenses`     | List expenses. Optional query: `category`, `from`, `to` (YYYY-MM-DD) |
| POST   | `/api/expenses`     | Create an expense                             |
| PUT    | `/api/expenses/:id` | Update an expense                             |
| DELETE | `/api/expenses/:id` | Delete an expense                             |
| GET    | `/health`           | Health check (verifies the database)          |

**Request body (POST / PUT)**

```json
{
  "name": "Groceries",
  "amount": 540.5,
  "category": "Food",
  "date": "2026-10-02"
}
```

Categories: `Food`, `Transport`, `Shopping`, `Bills`, `Entertainment`, `Other`.

**Responses:** `200` / `201` on success, `204` on delete, `400` for invalid input or ids, `404` when an expense doesn't exist, `500` for unexpected errors.

## Notes on a few decisions

- **Dates are returned as plain `YYYY-MM-DD` strings.** By default `pg` converts `DATE` columns to JavaScript `Date` objects, which can shift by a day depending on the server timezone. A custom type parser avoids this.
- **Money is stored as `NUMERIC(12,2)`**, not a floating-point type, to avoid rounding errors.
- **Validation lives on the server** as well as in the browser, so the API stays safe when called directly.
- **Table rows are built with `textContent`**, so user input can't inject HTML.

## Roadmap

- User accounts (JWT) so each person sees only their own expenses
- Monthly budgets per category with progress bars
- Recurring expenses and income tracking
- CSV import
- Automated API tests (Jest and Supertest)

## License

MIT
