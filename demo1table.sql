-- If the database doesn't exist, create it
CREATE DATABASE IF NOT EXISTS PickupPlus;
-- Switch to using the database
USE PickupPlus;

-- Drop the existing tables if they exist to prevent foreign key constraint errors
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Restaurant;

-- Create the User table
CREATE TABLE User (
  userid INT PRIMARY KEY, 
  firstname VARCHAR(255),
  lastname VARCHAR(255), 
  Address VARCHAR(255),
  email VARCHAR(255) UNIQUE, 
  phonenumber VARCHAR(255), 
  password VARCHAR(255),
  Salt VARCHAR(255),
  role VARCHAR(20)
);

-- Create the Restaurant table
CREATE TABLE Restaurant (
  restaurantid INT PRIMARY KEY,
  name VARCHAR(255),
  address VARCHAR(255),
  email VARCHAR(255),
  phonenumber VARCHAR(255),
  category VARCHAR(255) 
);

-- Now, create the Orders table with foreign key references
CREATE TABLE Orders (
  orderid INT AUTO_INCREMENT PRIMARY KEY,
  userid INT,
  restaurantid INT, 
  ordertime DATETIME,
  totalprice DECIMAL(10,2),
  orderstatus VARCHAR(255),
  FOREIGN KEY (userid) REFERENCES User(userid),
  FOREIGN KEY (restaurantid) REFERENCES Restaurant(restaurantid)
);

-- Insert example records into the User table
INSERT INTO User (userid, firstname, lastname, Address, email, phonenumber, password, Salt, role) VALUES
(1, 'John', 'Doe', '1234 Main St', 'john.doe@example.com', '555-1234', 'hashedpassword', 'salt', 'customer'),
(2, 'Jane', 'Smith', '5678 Market St', 'jane.smith@example.com', '555-5678', 'anotherhashedpassword', 'salt', 'customer');

INSERT INTO Restaurant (restaurantid, name, address, email, phonenumber, category) VALUES
(1, 'Doe Pizza', '123 Main St', 'contact@doespizza.com', '555-1111', 'Italian'),
(2, 'Smiths BBQ', '456 Market St', 'info@smithsbbq.com', '555-2222', 'American');
