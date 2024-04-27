async function openMenu(pool, restaurantID, res) { // Include `res` as a parameter
  let connection;
  try {
    connection = await pool.getConnection();
    const query = 'SELECT * FROM MenuItem WHERE restaurantid = ?';
    const [results] = await connection.query(query, [restaurantID]);

    if (results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "No items found" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal server error", error: error.message }));
  } finally {
    if (connection) { // Use `connection` instead of `db`
      connection.release();
    }
  }
}

async function addItem(pool, restaurantId, name, description, price) {
  console.log("Attempting to add item:", { restaurantId, name, description, price });
  let connection;
  try {
      connection = await pool.getConnection();
      const query = `INSERT INTO MenuItem (restaurantid, name, description, price) VALUES (?, ?, ?, ?)`;
      const [results] = await connection.query(query, [restaurantId, name, description, price]);
      console.log("Add item results:", results);
      return results;
  } catch (err) {
      console.error("Error in addItem:", err);
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

async function sortItemsByPrice(pool) {
  let connection;
  try {
    connection = await pool.getConnection();
    const query = 'SELECT * FROM MenuItem WHERE restaurantid = ? ORDER BY price ASC';
    const [sortedItems] = await connection.query(query, [restaurantID]);
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

function parseMenuItemsFromPDF(text, restaurantID) {
  const lines = text.split('\n');
  return lines.map(line => {
      // Split each line into parts by looking for hyphens that are likely delimiters.
      // This regex assumes that a hyphen used as a delimiter is surrounded by characters but not preceded by a space.
      const parts = line.split(/(?<! )-(?! )/).map(part => part.trim());
      if (parts.length === 3) {
          // Assuming that the first part is the name where we need to add spaces before each capital letter
          // except the first character.
          const name = parts[0].replace(/([A-Z])/g, ' $1').trim();
          const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
          const description = parts[1];
          const price = parseFloat(parts[2].replace(/[^\d.-]/g, '')); // Clean the price string of any non-numeric characters except decimal point and minus
          if (!isNaN(price)) {
              return {
                  restaurantID: restaurantID,
                  name: formattedName,
                  description: description,
                  price: price
              };
          }
      }
      return null;
  }).filter(item => item !== null);
}


module.exports = { openMenu, addItem, deleteItem, searchItems, listItemCategories, sortItemsByPrice, sortItemsByPrice, getItemsBelowPrice, parseMenuItemsFromPDF };
