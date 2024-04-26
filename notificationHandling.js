const nodeMailer = require('nodemailer');
require('dotenv').config();


const html = `
<H1>Thank you for your order!</H1>
<p>Your order has been placed successfully. We will notify you once your order is ready for pickup.</p>
`

async function main(){
    const transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com', // Replace with your mail server host
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER, // SMTP username from environment variables
            pass: process.env.SMTP_PASS // your SMTP password
        }
    });

    const info = await transporter.sendMail({
        from: 'PickupPlus <pickupplusru@gmail.com>',
        to: process.env.SMTP_TESTER,
        subject: 'Order Confirmation Test Message',
        html: html
    });

    console.log("message sent:" + info.messageId)
}
console.log(process.env.SMTP_USER);
main();