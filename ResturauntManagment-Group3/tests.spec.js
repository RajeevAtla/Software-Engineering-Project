const http = require('http');
const request = require('supertest');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { server, closeConnections } = require('./rMPass.js');
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
        host: '127.0.0.1',
        user: 'root',
        password: 'S0ccer577223!',
        database: 'PickupPlus'
    });
    setupDatabase();
});


// Clear the test database after all tests are done
afterAll(async () => {
    await testDb.end();
    closeConnections();
});


describe('Testing Restuarant management functions', () => {
    let newRestaurantId;

    
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

        // Verify that the restaurant is added to the database
        const [restaurants] = await testDb.query('SELECT * FROM restaurant WHERE name = ?', ["Test Restaurant"]);
        expect(restaurants.length).toBeGreaterThan(0);
        
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
    



    //adding more tests soon
});
