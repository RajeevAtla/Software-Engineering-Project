require('dotenv').config({ path: "../.env" })
const stripe = require('stripe')(process.env.STRIPE_API_SECRET)

async function createCustomer(name, email) { // Mark the function 'async'
  const customer = await stripe.customers.create({
    name: name,
    email: email,
  });
  console.log(customer);
}

createCustomer("test", "example@gmail.com"); // Call the async function 

