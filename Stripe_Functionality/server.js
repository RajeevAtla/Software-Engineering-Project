const http = require('http');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_API_SECRET);
const domain = "localhost"
// Replace with your actual Stripe publishable key
const YOUR_STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_API_PUBLIC;

// Basic server setup
const server = http.createServer(async (req, res) => {
  if (req.url === '/payment' && req.method === 'POST') {
    console.log("MADE IT HERE");

    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price: 'price_YOUR_STRIPE_PRODUCT_ID', // Replace with your price ID
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domain}/cancel`,
      });

      res.json({ url: session.url }); // Return the URL to the frontend
    } catch (error) {
      // Handle errors from Stripe
      console.error(error);
      res.status(500).send("Error processing payment");
    }
  } else {
    // Serve the frontend content
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`
      <html>
        <head>
          <title>Takeout App Payment</title>
          <script src="https://js.stripe.com/v3/"></script>
        </head>
        <body>
          <button id="checkout-button">Pay Now</button>
          <script src="checkout.js"></script>
        </body>
      </html>
    `);
    res.end();
  }
});

const port = 3000; // Or any other available port
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
