
var stripe = Stripe('pk_test_51P0ljm2N3QXdLmPgdMfyejewdDr2H8u9BFnFtLXtLh5kVGI6R4qb78ClMvuPutpG27kaTLhJ0M7vq39vnotrgofZ00KFLUK4Dc');

var elements = stripe.elements();

var style = {
  base: {
    fontSize: '16px',
    color: "#32325d",
  }
};

// Create an instance of the card Element
var card = elements.create('card', { style: style });

// Add an instance of the card Element into the `card-element` <div>
card.mount('#card-element');

card.addEventListener('change', ({ error }) => {
  const displayError = document.getElementById('card-errors');
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = '';
  }
});

// Handle form submission
var form = document.getElementById('payment-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const result = await stripe.createToken(card);
  if (result.error) {
    // Inform the user if there was an error
    var errorElement = document.getElementById('card-errors');
    errorElement.textContent = result.error.message;
  } else {
    // Send the token to your server
    stripeTokenHandler(result.token);
  }
});

// Submit the token and the rest of your form to the server
function stripeTokenHandler(token) {
  const amount = document.getElementById('amount').value;
  const currency = document.getElementById('currency').value;

  fetch('/charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: token.id,
      amount: amount * 100,  // Convert to cents
      currency: currency,
      receipt_email: 'customer@example.com'
    }),
  }).then(response => {
    return response.json();
  }).then(data => {
    console.log(data);
    alert('Payment successful!');
  }).catch(error => {
    console.error('Error:', error);
    alert('Payment failed');
  });
}
