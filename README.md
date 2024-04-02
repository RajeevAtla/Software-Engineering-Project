## For running main server:

change info in getDbConnection() to apply to your mySQL database (host, password)

Assuming you have node.js installed, run server by typing the following command line argument:

$ node server.js

Server should now be running, port number will be outputted to console. Use postman to send http requests with
appropriate body content for the desired function (detailed demonstration in video). As a general guide:

Register Restaurant -> POST request
-> body must be JSON object including the following fields: name, address, email, phonenumber, category, password

Login to Restaurant -> GET request
-> body not required, but must include a header with KEY = 'x-password' and VALUE = <your_password>
-> Additionally, path must include the restaurant ID of the restaurant you want to login to.

Edit Restaurant -> PUT request
-> Body should be a JSON object with the fields you want to edit, as well as their updated values
-> Path should include the restaurant ID of the restaurant you want to edit

Delete Restaurant -> DELETE request
-> Path should include the restaurant ID of the restaurant you want to delete

---

## For testing (tests in "tests.spec.js"):

make sure all dependencies are installed (http, supertest, fs, mysqp2/promise, bcrypt, fs.promises)
to install, type in terminal:

$ npm install <dependency_to_install>

This is assuming you already have node.js installed.
To run the tests, install jest, using the same method, and once installed type:

$ npx jest tests.spec.js

npx designates that jest is installed locally, if you have it installed globally than you can ignore that part.
