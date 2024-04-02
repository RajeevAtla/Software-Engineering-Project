async function getCartItems(pool, cartId) {
    let connection;
    try {
        connection = await pool.getConnection();

        // Query to fetch cart items along with details from MenuItem table
        const query = `
            SELECT ci.cartitemid, ci.quantity, mi.name, mi.description, mi.price
            FROM CartItems ci
            INNER JOIN MenuItem mi ON ci.itemid = mi.itemid
            WHERE ci.cartid = ?;
        `;

        const [items] = await connection.query(query, [cartId]);
        return items;
    } catch (err) {
        console.error("Error in getCartItems: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function addItemToCart(pool, cartId, itemId, quantity) {
    let connection;
    try {
        connection = await pool.getConnection();

        // Check if the item already exists in the cart
        const checkQuery = `SELECT * FROM CartItems WHERE cartid = ? AND itemid = ?`;
        const [existingItems] = await connection.query(checkQuery, [cartId, itemId]);

        let results;
        if (existingItems.length > 0) {
            // If the item exists, update the quantity
            const newQuantity = existingItems[0].quantity + quantity;
            const updateQuery = `UPDATE CartItems SET quantity = ? WHERE cartid = ? AND itemid = ?`;
            [results] = await connection.query(updateQuery, [newQuantity, cartId, itemId]);
        } else {
            // If the item does not exist, insert it
            const insertQuery = `INSERT INTO CartItems (cartid, itemid, quantity) VALUES (?, ?, ?)`;
            [results] = await connection.query(insertQuery, [cartId, itemId, quantity]);
        }

        return results;
    } catch (err) {
        console.error("Error in addItemToCart: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function deleteItemFromCart(pool, cartId, itemId, quantity = null) {
    let connection;
    try {
        connection = await pool.getConnection();

        // Check the current quantity of the item in the cart
        const checkQuery = `SELECT quantity FROM CartItems WHERE cartid = ? AND itemid = ?`;
        const [items] = await connection.query(checkQuery, [cartId, itemId]);

        if (items.length === 0) {
            throw new Error("Item not found in cart.");
        }

        let results;
        const currentQuantity = items[0].quantity;

        if (quantity === null || quantity >= currentQuantity) {
            // Remove the item completely if no quantity is specified or quantity is greater than or equal to current
            const deleteQuery = `DELETE FROM CartItems WHERE cartid = ? AND itemid = ?`;
            [results] = await connection.query(deleteQuery, [cartId, itemId]);
        } else {
            // Update the quantity if the specified quantity is less than the current
            const newQuantity = currentQuantity - quantity;
            const updateQuery = `UPDATE CartItems SET quantity = ? WHERE cartid = ? AND itemid = ?`;
            [results] = await connection.query(updateQuery, [newQuantity, cartId, itemId]);
        }

        return results;
    } catch (err) {
        console.error("Error in deleteItemFromCart: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function clearCart(pool, cartId) {
    let connection;
    try {
        connection = await pool.getConnection();

        // Query to delete all items from a specific cart
        const query = `DELETE FROM CartItems WHERE cartid = ?`;
        const [result] = await connection.query(query, [cartId]);

        return result;
    } catch (err) {
        console.error("Error in clearCart: ", err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}


module.exports = {
    getCartItems,
    addItemToCart,
    deleteItemFromCart,
    clearCart
};


