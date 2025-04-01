const { Pool } = require ('pg');

const pool = new Pool({
    user: "mybyke_user",
    password: "p60EUTJfkE0mN5ACrzHAYw1sYnEiETQ1",
    host: "dpg-cvm25r3ipnbc739ii6q0-a.ohio-postgres.render.com",
    port: 5432,
    database: "mybyke",
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, parms) => pool.query(text, parms)
};