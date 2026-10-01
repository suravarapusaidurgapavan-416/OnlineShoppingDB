# Online Shopping System — DBMS Project (OnlineShoppingDB)
React + TypeScript + Tailwind CSS (Vite).

## Run
    npm install
    npm run dev        # open http://localhost:5173

The app runs on an in-browser copy of the database (same tables and rules as MySQL), so every feature
works immediately. Data resets on refresh.

## MySQL
`database/schema.sql` creates OnlineShoppingDB with all 8 tables, constraints, sample data and the OrderSummary view:

    mysql -u root -p < database/schema.sql

Use it for your SQL script, Workbench screenshots and viva demo.

## Not included
A Node/Express layer connecting the React app to MySQL is not included. The in-browser database stands in for it.
