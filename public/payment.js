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


function stripeTokenHandler(token) {
  const amountElement = document.getElementById('amount');
  const currencyElement = document.getElementById('currency');

  if (!amountElement || !currencyElement) {
    console.error('Payment form elements are missing!');
    return;
  }

  const amount = amountElement.value;
  const currency = currencyElement.value;


  function getAmount() {
    let amount = parseInt(document.getElementById('amount').value * 100);
    // alert(amount);
    return amount;
  }


  function getEmail() {
    let email = document.getElementById('email').value;
    // alert(email);
    return email;
  }

  function getCurrency() {
    let currency = document.getElementById('currency').value;
    // alert(currency);
    return currency;
  }

  fetch('/charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      {
        userid: 1,
        cartid: 1,
        token: "please update with jwt_token",
        transaction: {
          source: token.id,
          receipt_email: getEmail(),
          amount: getAmount(),
          currency: getCurrency(),
          description: "Example charge"
        }
      }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Payment successful:', data.charge);
        // Redirect to a confirmation page or update the UI
        window.location.href = `/confirmation.html?code=${data.charge.id}`;
        // emit event to restaurants for purchase order
        // emit event order log
        //
      } else {
        throw new Error(data.error);
      }
    })
    .catch(error => {
      console.error('Payment failed:', error);
      alert('Payment failed: ' + error.message);
    });

}
