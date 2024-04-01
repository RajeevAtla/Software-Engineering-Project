-- Create the database if it doesn't exist and use it
CREATE DATABASE IF NOT EXISTS PickupPlus;
USE PickupPlus;

-- Drop existing tables to prevent foreign key constraint errors
-- Drop tables in reverse order of their dependencie
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS CartItems;
DROP TABLE IF EXISTS Cart;
DROP TABLE IF EXISTS MenuItem;
DROP TABLE IF EXISTS Restaurant;
DROP TABLE IF EXISTS User;

-- Recreate tables with the new schema
CREATE TABLE User (
  userid INT AUTO_INCREMENT PRIMARY KEY , 
  firstname VARCHAR(255),
  lastname VARCHAR(255), 
  address VARCHAR(255),
  email VARCHAR(255) UNIQUE, 
  phonenumber VARCHAR(255), 
  password VARCHAR(255),
  salt VARCHAR(255),
  role VARCHAR(20)
);

CREATE TABLE Restaurant (
  restaurantid INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  address VARCHAR(255),
  email VARCHAR(255),
  phonenumber VARCHAR(255),
  category VARCHAR(255), 
  password VARCHAR(255)
);

CREATE TABLE MenuItem (
  itemid INT AUTO_INCREMENT PRIMARY KEY,
  restaurantid INT,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  FOREIGN KEY (restaurantid) REFERENCES Restaurant(restaurantid)
);

CREATE TABLE Cart (
  cartid INT AUTO_INCREMENT PRIMARY KEY,
  userid INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userid) REFERENCES User(userid)
);

CREATE TABLE CartItems (
  cartitemid INT AUTO_INCREMENT PRIMARY KEY,
  cartid INT,
  itemid INT,
  quantity INT,
  FOREIGN KEY (cartid) REFERENCES Cart(cartid),
  FOREIGN KEY (itemid) REFERENCES MenuItem(itemid)
);

CREATE TABLE Orders (
  orderid INT AUTO_INCREMENT PRIMARY KEY,
  cartid INT,
  userid INT,
  ordertime DATETIME,
  totalprice DECIMAL(10,2) DEFAULT 0,
  orderstatus VARCHAR(255),
  FOREIGN KEY (cartid) REFERENCES Cart(cartid),
  FOREIGN KEY (userid) REFERENCES User(userid)
);


INSERT INTO User (userid, firstname, lastname, address, email, phonenumber, password, salt, role) VALUES
(1, 'Jane', 'Doe', '123 Elm Street', 'jane.doe@example.com', '555-1234', 'hashed_password_here', 'salt_here', 'customer');

INSERT INTO Restaurant (restaurantid, name, address, email, phonenumber, category) VALUES
(1, 'Pizza Palace', '456 Main Street', 'info@pizzapalace.com', '555-5678', 'Italian');

-- Add a pizza item
INSERT INTO MenuItem (restaurantid, name, description, price) VALUES
(1, 'Margherita Pizza', 'Classic Margherita with fresh mozzarella, tomatoes, and basil.', 10.00);

-- Add a pasta item
INSERT INTO MenuItem (restaurantid, name, description, price) VALUES
(1, 'Spaghetti Carbonara', 'Spaghetti with creamy carbonara sauce.', 12.00);

INSERT INTO Cart (userid) VALUES
(1);

-- Add Margherita Pizza to the cart
INSERT INTO CartItems (cartid, itemid, quantity) VALUES
(1, 1, 1);

-- Add Spaghetti Carbonara to the cart
INSERT INTO CartItems (cartid, itemid, quantity) VALUES
(1, 2, 2);


INSERT INTO Orders (cartid, userid, ordertime, orderstatus) VALUES
(1, 1, NOW(), 'Pending');


