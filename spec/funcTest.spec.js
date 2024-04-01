const supertest = require('supertest');
const server = require('../funcTest.js');
const mysql = require('mysql2/promise');
const fs = require('fs').promises; 


// this is for resetting the database to its original form after each test case is ran
async function setupDatabase() {
    const sql = await fs.readFile('./demo1table.sql', 'utf8');
    const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'i<3rutgers' });
  
    const queries = sql.split(';').map(query => query.trim()).filter(query => query.length);
  
    for (const query of queries) {
      await connection.query(query);
    }
    
    await connection.end();
  }

describe('Order Management function tests with mySQL server', () => {
    let request = supertest(server);

    beforeEach(async () => { // runs the sql file to set up the data base before every test case
        await setupDatabase();
      });
    
    afterEach(async () => { // runs the sql file to set up the data base before every test case
        await setupDatabase();
    });
    

    it('should create a new order', async () => {
        const response = await request
        .post('/api/orders')
        .send({ cartId: 1, userId: 1 });
        
        expect(response.statusCode).toEqual(200);
        expect(response.text).toContain('Order created successfully');
    });

    it('should fetch the status of an order', async () => {
        const response = await request
          .get('/api/orders/1');
        
        expect(response.statusCode).toEqual(200);
        expect(response.text).toContain('status');
        expect(response.text).toContain('Pending');
      });

    it('should update the status of an order', async () => {
    const response = await request
        .put('/api/orders/notifications/1');
    
        expect(response.statusCode).toEqual(200);
        expect(response.text).toContain('Order status updated successfully');
    });

    it('should cancel an order', async () => {
        const response = await request
          .delete('/api/orders/1');
        
        expect(response.statusCode).toEqual(200);
        expect(response.text).toContain('Order cancelled successfully');
      });

    it('should handle failure when trying to update status of a non-existing order', async () => {
        const orderNumber = '3';
        const response = await request
            .put(`/api/orders/notifications/${orderNumber}`);
        
        expect(response.statusCode).toEqual(404);
        expect(response.body.error).toEqual('Order not found');
    });

    it('should handle failure when trying to fetch the status of a non-existing order', async () => {
        const orderNumber = '3';
        const response = await request
            .get(`/api/orders/${orderNumber}`);
        
        expect(response.statusCode).toEqual(404);
        expect(response.body.error).toEqual('Order not found');
    });

    it('should handle failure when trying to delete a non-existing order', async () => {
        const orderNumber = '3';
        const response = await request
            .delete(`/api/orders/${orderNumber}`);
        
        expect(response.statusCode).toEqual(404);
        expect(response.body.error).toEqual('Order not found');
    });

    it('should handle failure when trying to delete a non-Pending order', async () => {
        const orderNumber = '1';
        await request.put(`/api/orders/notifications/${orderNumber}`); // updates order 1 from pending to in progress
        const response = await request
            .delete(`/api/orders/${orderNumber}`);
        
        expect(response.statusCode).toEqual(500);
        expect(response.body.error).toEqual('Order needs to have Pending status to be canceled');
    });

    it('should return an error for trying to create an order for a cart ID that does not exist', async () => {
        const response = await request
        .post('/api/orders')
        .send({ cartId: 2, userId: 1 });
        
        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toContain('Cart id not found');
    });

    it('should return an error for trying to create an order for a user ID that does not exist', async () => {
        const response = await request
        .post('/api/orders')
        .send({ cartId: 1, userId: 2 });
        
        expect(response.statusCode).toEqual(404);
        expect(response.body.message).toContain('User id not found');
    });


    it('Tests to make sure update status can update an order through all its statuses', async () => {
        let response1 = await request
          .get('/api/orders/1');
        expect(response1.text).toContain('Pending');

        await request.put(`/api/orders/notifications/1`); // updates order status from pending to in progress

        response1 = await request
          .get('/api/orders/1');
        expect(response1.text).toContain('In Progress')

        await request.put(`/api/orders/notifications/1`); // updates order status from in progress to ready

        response1 = await request
        .get('/api/orders/1');
         expect(response1.text).toContain('Ready')

        await request.put(`/api/orders/notifications/1`); // updates order status from ready to completed
        
        response1 = await request
        .get('/api/orders/1');
         expect(response1.text).toContain('Completed')
      });

      it('Tests to make sure there is an error message when trying to go higher than a status than completed', async () => {

        await request.put(`/api/orders/notifications/1`); // updates order status from pending to in progress
        await request.put(`/api/orders/notifications/1`); // updates order status from in progress to ready
        await request.put(`/api/orders/notifications/1`); // updates order status from ready to completed

        let response = await request.put(`/api/orders/notifications/1`); 
         expect(response.body.message).toContain('Order is already completed');
      });

    







})