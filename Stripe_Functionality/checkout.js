
const stripe = Stripe(YOUR_STRIPE_PUBLISHABLE_KEY);

const checkoutButton = document.getElementById('checkout-button');

checkoutButton.addEventListener('click', async () => {
  // Create a Stripe Checkout session (Server-side step)
  const session = await fetch('/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 1000, // Amount in cents
      currency: 'usd'
    })
  }).then(res => res.json());

  // Redirect to Stripe Checkout
  stripe.redirectToCheckout({
    sessionId: session.id
  });
});
