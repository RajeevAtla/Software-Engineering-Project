const http = require('http');
const request = require('supertest');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { server, closeConnections } = require('./rMPass.js');

// Set up a test database connection
let testDb;

beforeAll(async () => {
    testDb = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'your_password',
        database: 'your_db'
    });
});

// Clear the test database after all tests are done
afterAll(async () => {
    //await testDb.query('DROP DATABASE PickupPlus');
    await testDb.end();
    closeConnections();
});

async function clearDatabase(){
    await testDb.query('DROP DATABASE PickupPlus');
}

describe('Testing Restuarant management functions', () => {
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
            .get('/api/restaurants/4')
            .set('Content-Type', 'application/json')
            .set('x-password', JSON.stringify({"password": "testpassword"}));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            restaurantid: expect.any(Number),
            name: "Test Restaurant",
            address: "123 Test Street",
            email: "test@example.com",
            phonenumber: "123-456-7890",
            category: "Test Category"
        });
    });

    //adding more tests soon
});