const http = require('http');
const request = require('supertest');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { server, closeConnections } = require('./userChoice.js');
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
        password: 'your_pass',
        database: 'PickupPlus'
    });
    setupDatabase();
});


// Clear the test database after all tests are done
afterAll(async () => {
    await testDb.end();
    closeConnections();
});


describe('Testing User Account functions', () => {

    //valid test cases w/ proper use
    it('should register a new user', async () => {
        const response = await request(server)
            .post('/api/users')
            .send({
                firstname: "Test",
                lastname: "User",
                address: "456 Test Street",
                email: "test@example.com",
                phonenumber: "123-456-7890",
                password: "testpassword"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('user registered successfully.');

        // verify that changes were actually made to db
        const [user] = await testDb.query('SELECT * FROM user WHERE firstname = ?', ["Test"]);
        expect(user.length).toBeGreaterThan(0);
        
    });


    it ('should login to previously created account', async () => {
        const response = await request(server)
            .get('/api/users/1')
            .set('Content-Type', 'application/json')
            .set('x-password', JSON.stringify({"password": "example_pass"}));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userid: expect.any(Number),
            firstname: "Jane",
            address: "123 Elm Street",
            email: "jane.doe@example.com",
            phonenumber: "555-1234",
            lastname: "Doe",
            role: "customer"
        });
    });
    
    it('should remove an existing user', async () => {
        const response = await request(server)
            .delete('/api/users/2');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({message: "user removed successfully"});

    });

    it ('should edit a field in an existing account', async () => {
        const response = await request(server)
            .put('/api/users/1')
            .send({
                address: "456 Updated Ave.",
                email: "updated@email.com"
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({message: "user updated successfully"});

            // make sure that field is actually edited in db
            const [address] = await testDb.query('SELECT address FROM user WHERE userid = 1');
            expect(address[0].address).toEqual("456 Updated Ave.");
            const [email] = await testDb.query('SELECT email FROM user WHERE userid = 1');
            expect(email[0].email).toEqual("updated@email.com");
    });


    //Now, testing for proper error detection
    it('should return "error: not found" when given incorrect path', async () => {
        const response = await request(server)
            .delete('/api/users'); //incorrect path

        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Not Found"});
    });

    it('should return an error when given improper password type', async () => {
        const response = await request(server)
            .post('/api/users')
            .send({
                name: "Test User",
                address: "123 Test Street",
                email: "test@example.com",
                phonenumber: "123-456-7890",
                category: "Test Category",
                password: 1
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Error hashing password');
        
    });

    it('should return an error when trying to login with an invalid user id', async () => {
        const response = await request(server)
            .get('/api/users/10'); //invalid user id 10
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('user not found');
    });

    it('should return an error when trying to login without proper password header', async () => {
        const response = await request(server)
            .get('/api/users/1')
            .set('Content-Type', 'application/json')
            .set('x-password', JSON.stringify({"passwurd": "example_pass"})); //incorrect spelling on password field

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Error comparing passwords');
    });

    it('should return an error when trying to login with an incorrect password', async () => {
        const response = await request(server)
            .get('/api/users/1')
            .set('Content-Type', 'application/json')
            .set('x-password', JSON.stringify({"password": "incorrect_password"})); 

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid password');
    });

    it ('should return an error when attempting to edit a field that does not exist', async () => {
        const response = await request(server)
            .put('/api/users/1')
            .send({
                menu: "test menu"
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({message: "user not found or update failed"});

    });

    it ('should return an error when attempting to edit with an improper userid', async () => {
        const response = await request(server)
            .put('/api/users/10')
            .send({
                address: "456 Updated Ave.",
                email: "updated@email.com"
            });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({message: "user not found or update failed"});

    });

    it ('should return an error when attempting to delete a non-existant user', async () => {
        const response = await request(server)
            .delete('/api/users/10');
            

            expect(response.status).toBe(404);
            expect(response.body).toEqual({message: "user not found or already removed"});

    });


});
