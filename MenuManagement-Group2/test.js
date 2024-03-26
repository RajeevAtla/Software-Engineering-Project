const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'sweteam',
    database: 'PickupPlus'
});

async function testAddMenuItem() {
    let connection;
    try {
        connection = await pool.getConnection();

        // Example new item details
        const newItem = {
            restaurantid: 1, // Assuming this restaurant ID exists in your Restaurant table
            name: 'Test Pizza',
            description: 'A delicious test pizza',
            price: 9.99
        };

        // Insert new item into MenuItem table
        const insertQuery = 'INSERT INTO MenuItem (restaurantid, name, description, price) VALUES (?, ?, ?, ?)';
        const [insertResult] = await connection.query(insertQuery, [newItem.restaurantid, newItem.name, newItem.description, newItem.price]);
        console.log('Item added with ID:', insertResult.insertId);

        // Retrieve the item to verify
        const selectQuery = 'SELECT * FROM MenuItem WHERE itemid = ?';
        const [rows] = await connection.query(selectQuery, [insertResult.insertId]);

        if (rows.length > 0) {
            console.log('Verification successful:', rows[0]);
        } else {
            console.log('Verification failed: Item not found');
        }

    } catch (err) {
        console.error("Error: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function displayMenuItems() {
    let connection;
    try {
        // Get a connection from the pool
        connection = await pool.getConnection();

        // Query to select all items from MenuItem
        const query = 'SELECT * FROM MenuItem';
        const [rows] = await connection.query(query);

        // Check if menu items exist
        if (rows.length > 0) {
            console.log('Menu Items:');
            rows.forEach(item => {
                console.log(`ID: ${item.itemid}, Name: ${item.name}, Description: ${item.description}, Price: ${item.price}`);
            });
        } else {
            console.log('No menu items found.');
        }

    } catch (err) {
        console.error("Error: ", err);
        throw err;
    } finally {
        // Release the connection
        if (connection) {
            connection.release();
        }
    }
}

displayMenuItems();
