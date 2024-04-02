const http = require('http');
const mysql = require('mysql2/promise');
const url = require('url');

//connect to mySQL
// Connection pool configuration
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'i<3rutgers',
    database: 'PickupPlus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//openMenu function. Function should open menu based on the restaurantID. 
async function openMenu(restaurantID) {
    let connection;
    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        const query = 'SELECT * FROM MenuItem WHERE restaurantid = ?';
        const [results] = await connection.query(query, [restaurantID]);

        // Assuming results is an array of menu items, we return it directly.
        return results; // Directly return the array of menu items.
    } catch (err) {
        console.error("Error in openMenu: ", err);
        throw err;
    } finally {
        if (connection) connection.release(); // Release the connection back to the pool
    }
}

async function addItem(restaurantId, name, description, price) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `INSERT INTO MenuItem (restaurantid, name, description, price)
                       VALUES (?, ?, ?, ?)`;
        const [results] = await connection.query(query, [restaurantId, name, description, price]);
        return results;
    } catch (err) {
        console.error("Error in addItem: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}


async function deleteItem(itemID) {
    let connection;
    try {
        // Attempt to get a connection from the pool
        connection = await pool.getConnection();
        // Corrected the column name to 'itemid' as per your table schema
        const query = 'DELETE FROM MenuItem WHERE itemid = ?';
        // Execute the delete query with the provided itemID
        const [results] = await connection.query(query, [itemID]);
        // Return the results of the delete operation
        return results;
    } catch (err) {
        // Log the error to the console
        console.error("Error in deleteItem: ", err);
        throw err; // Rethrow the error to handle it in the calling function
    } finally {
        // Ensure the database connection is always released back to the pool
        if (connection) connection.release();
    }
}


async function searchItems(itemID) {
    let connection;
    try {
        // Attempt to get a connection from the pool
        connection = await pool.getConnection();
        // Updated query to use the correct column name 'itemid'
        const query = 'SELECT * FROM MenuItem WHERE itemid = ?';
        // Execute the query with the provided itemID
        const [results] = await connection.query(query, [itemID]);
        // Return the results of the query, which could be an empty array if no items are found
        return results;
    } catch (err) {
        // Log the error for debugging purposes
        console.error("Error in searchItems: ", err);
        throw err; // Rethrow the error for further handling, such as sending an HTTP response code
    } finally {
        // Ensure the database connection is always released back to the pool, preventing connection leaks
        if (connection) connection.release();
    }
}

//We dont have catagories right now, ignore this function
async function listItemCategories(restaurantID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT category FROM categories WHERE restaurant_id = ?';
        const [results] = await connection.query(query, [restaurantID]);
        return results;
    } catch (err) {
        console.error("Error in listItemCategories: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function sortItemsByPrice() {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT * FROM MenuItem ORDER BY price ASC';
        const [sortedItems] = await connection.query(query);
        return sortedItems;
    } catch (err) {
        console.error("Error in sortItemsByPrice: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function getItemsBelowPrice(priceLimit) {
    let connection;
    try {
        connection = await pool.getConnection();
        // Ensure you're using the correct table name and column names as per your schema
        const query = 'SELECT * FROM MenuItem WHERE price <= ?';
        const [items] = await connection.query(query, [priceLimit]);
        return items;
    } catch (err) {
        console.error("Error in getItemsBelowPrice: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { openMenu, addItem, deleteItem, searchItems, listItemCategories, sortItemsByPrice, sortItemsByPrice,getItemsBelowPrice };