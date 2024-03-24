const mysql = require('mysql2/promise');

// Assuming you have established a database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'i<3rutgers',
  database: 'PickupPlus'
};

// Function to place a new order
async function placeNewOrder(cartId, userId) {
    let connection;
    let orderResult; // Declare orderResult outside the try block to widen its scope
  
    try {
      connection = await mysql.createConnection(dbConfig);
      await connection.beginTransaction();
  
      // Calculate the total price for the order
      const [cartItems] = await connection.query(
        'SELECT ci.quantity, mi.price FROM CartItems ci JOIN MenuItem mi ON ci.itemid = mi.itemid WHERE ci.cartid = ?',
        [cartId]
      );
  
      const totalPrice = cartItems.reduce((acc, currentItem) => {
        return acc + (currentItem.quantity * currentItem.price);
      }, 0);
  
      // Insert the new order into the Orders table
      orderResult = await connection.query( // use let or const declared outside try
        'INSERT INTO Orders (cartid, userid, ordertime, totalprice, orderstatus) VALUES (?, ?, NOW(), ?, ?)',
        [cartId, userId, totalPrice, 'Pending']
      );
  
      await connection.commit();
      console.log(`Order placed successfully with ID: ${orderResult[0].insertId}`);
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Failed to place order:', error);
      throw error; // Rethrow the error to handle it in the calling function
    } finally {
      if (connection) await connection.end();
    }
  
    return orderResult[0].insertId;
  }
  
  async function printOrderDetails(orderNumber) {
    const connection = await mysql.createConnection(dbConfig);
  
    try {
      // Fetch order details
      const [orderDetails] = await connection.query(
        'SELECT o.orderid, o.ordertime, o.totalprice, o.orderstatus, u.firstname, u.lastname, o.cartid FROM Orders o JOIN User u ON o.userid = u.userid WHERE o.orderid = ?',
        [orderNumber]
      );
  
      if (orderDetails.length === 0) {
        console.log(`No order found with ID: ${orderNumber}`);
        return;
      }
  
      const order = orderDetails[0];
  
      // Fetch items for the order using the cartid from the order details
      const [items] = await connection.query(
        'SELECT mi.name, mi.description, mi.price, ci.quantity FROM CartItems ci JOIN MenuItem mi ON ci.itemid = mi.itemid WHERE ci.cartid = ?',
        [order.cartid]
      );
  
      // Print order details
      console.log(`Order ID: ${order.orderid}`);
      console.log(`Order Time: ${order.ordertime}`);
      console.log(`Customer Name: ${order.firstname} ${order.lastname}`);
      console.log(`Total Price: $${parseFloat(order.totalprice).toFixed(2)}`);
      console.log(`Order Status: ${order.orderstatus}`);
      console.log('Items:');
      items.forEach(item => {
        console.log(`- ${item.name}: ${item.quantity} x $${parseFloat(item.price).toFixed(2)} (Description: ${item.description})`);
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      // Always close the connection
      await connection.end();
    }
  }
  
async function createAndPrintOrder(cartId, userId) {
  try {
    const orderId = await placeNewOrder(cartId, userId); // This waits for the order ID
    console.log('Order placement process completed.');
    await printOrderDetails(orderId); // Now prints details for the new order
  } catch (error) {
    // If placeNewOrder throws an error, it will be caught here
    console.error('An error occurred:', error);
  }
}

// Use the function to place a new order and print its details
createAndPrintOrder(1, 1);
