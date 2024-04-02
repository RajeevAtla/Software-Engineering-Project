//openMenu function. Function should open menu based on the restaurantID. 
async function openMenu(pool, restaurantID) {
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

async function addItem(pool, restaurantID, name, description, price) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `INSERT INTO MenuItem (restaurantid, name, description, price)
                       VALUES (?, ?, ?, ?)`;
        const [results] = await connection.query(query, [restaurantID, name, description, price]);
        return results;
    } catch (err) {
        console.error("Error in addItem: ", err);
        throw err;  
    } finally {
        if (connection) connection.release();
    }
}


async function deleteItem(pool, itemID) {
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


async function searchItems(pool, itemID) {
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

//We dont have catagories right now, ignore this function - ok
async function listItemCategories(pool, restaurantID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT category FROM Restaurant WHERE restaurantid = ?';
        const [results] = await connection.query(query, [restaurantID]);
        return results;
    } catch (err) {
        console.error("Error in listItemCategories: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function sortItemsByPrice(pool, restaurantID) {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = 'SELECT * FROM MenuItem WHERE restaurantid = ? ORDER BY price ASC';
        const [sortedItems] = await connection.query(query, [restaurantID]);
        if (sortedItems.length === 0) {
            return { message: "No items found for the given restaurantID" };
        }
        return sortedItems;
    } catch (err) {
        console.error("Error in sortItemsByPrice: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}


async function getItemsBelowPrice(pool, priceLimit) {
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
