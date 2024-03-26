const http = require('http');
const request = require('supertest');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { server, closeConnections } = require('./restaurantManagement.js');
const fs = require('fs').promises;

// Set up a test database connection
let testDb;

async function setupDatabase() {
    const sql = await fs.readFile('./demo1table-3.sql', 'utf8');
    
    const queries = sql.split(';').map(query => query.trim()).filter(query => query.length);
  
    for (const query of queries) {
      await testDb.query(query);
    }
    
  }

  
beforeAll(async () => {
    testDb = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'your_password',
        database: 'your_db'
    });
    setupDatabase();
});


// Clear the test database after all tests are done
afterAll(async () => {
    await testDb.end();
    closeConnections();
});


describe('Testing Restuarant management functions', () => {

    //valid test cases w/ proper use
    it('should register a new restaurant', async () => {
        const response = await request(server)
            .post('/api/restaurants')
            .send({
                name: "Test Restaurant",
                address: "123 Test Street",
                email: "test@example.com",
                phonenumber: "123-456-7890",
                category: "Test Category",
                password: "testpassword"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Restaurant registered successfully.');

        // verify that changes were actually made to db
        const [restaurants] = await testDb.query('SELECT * FROM restaurant WHERE name = ?', ["Test Restaurant"]);
        expect(restaurants.length).toBeGreaterThan(0);
        
    });

    it ('should store missing values as NULL when registering a restaurant', async () => {
        const response = await request(server)
            .post('/api/restaurants')
            .send({
                name: "Another test",
                email: "test@example.com",
                phonenumber: "123-456-7890",
                category: "Test Category",
                password: "testpassword"
            });

            expect(response.status).toBe(200);
            const [restaurantid] = await testDb.query('SELECT restaurantid FROM restaurant WHERE name = ?', ["Another test"]);
            const [address] = await testDb.query('SELECT address FROM restaurant WHERE restaurantid = ?', [restaurantid[0].restaurantid]);
            expect(address[0].address).toEqual(null);

    });

    it ('should login to previously created restaurant', async () => {
        const response = await request(server)
            .get('/api/restaurants/3')
            .set('Content-Type', 'application/json')
            .set('x-password', JSON.stringify({"password": "example_pass"}));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            restaurantid: expect.any(Number),
            name: "Chipotle",
            address: "99 test avenue",
            email: "chipotle@gmail.com",
            phonenumber: "555-5678",
            category: "Mexican"
        });
    });
    
    it('should remove an existing restaurant', async () => {
        const response = await request(server)
            .delete('/api/restaurants/4');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({message: "Restaurant removed successfully"});

    });

    it ('should edit a field in an existing restaurant', async () => {
        const response = await request(server)
            .put('/api/restaurants/1')
            .send({
                address: "456 Updated Ave.",
                email: "updated@email.com"
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({message: "Restaurant updated successfully"});

            // make sure that field is actually edited in db
            const [address] = await testDb.query('SELECT address FROM restaurant WHERE restaurantid = 1');
            expect(address[0].address).toEqual("456 Updated Ave.");
            const [email] = await testDb.query('SELECT email FROM restaurant WHERE restaurantid = 1');
            expect(email[0].email).toEqual("updated@email.com");
    });


    //Now, testing for proper error detection
    it('should return "error: not found" when given incorrect path', async () => {
        const response = await request(server)
            .delete('/api/restuhrant'); //incorrect path

        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Not Found"});
    });

    it('should return an error when given improper password type', async () => {
        const response = await request(server)
            .post('/api/restaurants')
            .send({
                name: "Test Restaurant",
                address: "123 Test Street",
                email: "test@example.com",
                phonenumber: "123-456-7890",
                category: "Test Category",
                password: 1
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Error hashing password');
        
    });

    it('should return an error when trying to login with an invalid restaurant id', async () => {
        const response = await request(server)
            .get('/api/restaurants/10'); //invalid restaurant id 10
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Restaurant not found');
    });

    it('should return an error when trying to login without proper password header', async () => {
        const response = await request(server)
            .get('/api/restaurants/3')
            .set('Content-Type', 'application/json')
            .set('x-password', JSON.stringify({"passwurd": "example_pass"})); //incorrect spelling on password field

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Error comparing passwords');
    });

    it('should return an error when trying to login an incorrect password', async () => {
        const response = await request(server)
            .get('/api/restaurants/3')
            .set('Content-Type', 'application/json')
            .set('x-password', JSON.stringify({"password": "incorrect_password"})); 

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid password');
    });

    it ('should return an error when attempting to edit a field that does not exist', async () => {
        const response = await request(server)
            .put('/api/restaurants/1')
            .send({
                menu: "test menu"
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({message: "Restaurant not found or update failed"});

    });

    it ('should return an error when attempting to edit with an improper restaurantid', async () => {
        const response = await request(server)
            .put('/api/restaurants/10')
            .send({
                address: "456 Updated Ave.",
                email: "updated@email.com"
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({message: "Restaurant not found or update failed"});

    });

    it ('should return an error when attempting to delete a non-existant restaurant', async () => {
        const response = await request(server)
            .delete('/api/restaurants/10');
            

            expect(response.status).toBe(404);
            expect(response.body).toEqual({message: "Restaurant not found or already removed"});

    });


});
