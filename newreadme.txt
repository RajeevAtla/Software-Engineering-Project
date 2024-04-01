http://127.0.0.1:4002/api/users/register

{
  "firstname": "Johnny",
  "lastname": "Doe",
  "address": "123 Main St",
  "email": "johnny.doe@example.com",
  "phonenumber": "555-1234",
  "password": "password123"
}


POST http://127.0.0.1:4002/api/users/login
{
  "email": "john.doe@example.com",
  "password": "password123"
}


DELETE http://127.0.0.1:4002/api/users/delete/6


PUT http://127.0.0.1:4002/api/users/edit/1
{
  "address": "456 New Address St",
  "phonenumber": "0987654321"
}
