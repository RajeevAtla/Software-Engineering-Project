This is the code that contains the code and server for our order managment system.
Some example commands are as follows:

POST http://127.0.0.1:4002/api/orders  
{
  "cartId": "1",
  "userId": "1"
}

GET http://127.0.0.1:4002/api/orders/1

PUT http://127.0.0.1:4002/api/orders/notifications/1

DELETE http://127.0.0.1:4002/api/orders/1


please install jasmine and mysql12 to run this code

jasmine test cases can be run via the following command

npx jasmine

ensure you have the correct connection information for both the mysql database and the server
