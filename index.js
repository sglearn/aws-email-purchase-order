"use strict"

const aws = require('aws-sdk');

// Create a new SES object. 
const ses = new aws.SES({
  region: process.env.REGION
});

const sender = `${process.env.SENDER_NAME} <${process.env.SENDER_MAIL_ADDRESS}>`;

// const configuration_set = "ConfigSet";

function sendEmail({recipient, customer, invoice, banks}) {


  // The subject line for the email.
  const subject = "Purchase Order Received";

  
  const signature = `
    ${process.env.SIGNATURE}
  `

  // The email body for recipients with non-HTML email clients.
  let body_text = "Dear " + customer + ",\r\n"
                  + "Your order at our service at " +  process.env.SERVICE + " "
                  + "has been placed successfully \r\n"
                  + "Purchased Items: \r\n"

  invoice.items.forEach(item => {
    body_text += " " + item.name + "\r\n"
  })        

  body_text += "Subtotal: " + invoice.subTotal

  body_text += "Please complete your payment by wire transfer to one of the following accounts\r\n"

  for(let key in banks) {
    const bank = banks[key]
    body_text +=  bank.name + "\r\n"
                + "Account name: " + bank.account.name + "\r\n" 
                + "Account Number: " + bank.account.number + "\r\n"
  }

  body_text +=  "Thank you for using our service.\r\n"
              + "This email is auto-generated. Please do not reply this email.\r\n"
              + "Sincerely,\r\n"

  body_text += signature

  // The HTML body of the email.
  let body_html = `<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      table, th, td {
        border: 1px solid black;
      }
      table {
        border-collapse: collapse;
      }
      th, td {
        padding: 15px;
        text-align: left;
      }
      th {
        background-color: #4CAF50;
        color: white;
      }
      .bold {
        font-weight: bold;
      }
      .orange {
        color: #ff9800;
      }
    </style>
  </head>
  <body>
    <p>Dear ${customer},</p>
    <p>Your order at our service at <b> ${process.env.SERVICE} </b> has been placed successfully</p>
    <h2>Order information</h2>
  `

  body_html += `
    <table>
      <tr>
        <th> Items </th>
        <th> Price </th>
      </tr>
  `

  invoice.items.forEach(item => {
    body_html += `
        <tr>
          <td> ${item.name} </td>
          <td> ${localeString(item.price.offer)} ₫ </td>
        </tr>
    `
  }) 
  
  body_html += `
      <tr class="bold">
        <td> Subtotal </td>
        <td class="orange"> ${localeString(invoice.subTotal)} ₫ </td>
      </tr>
    </table>
  `
  body_html += `
    <br />
    <p> Please complete your payment by wire transfer to one of the following accounts </p>
  `

  for(let key in banks) {
    const bank = banks[key]
    body_html += `
      <br />
      <p><b> ${bank.name} </b></p>
      <p> Account name: ${bank.account.name} </p>
      <p> Account Number: ${bank.account.number} </p>
    `
  }

  body_html += `
    <br />
    <p> Thank you for using our service. </p>
    <p> This email is auto-generated. Please <b>do not reply</b> this email </p>
  `

  body_html += `
    <br />
    <p> Sincerely, </p>
    ${signature}
  </body>
  </html>
  `

  // The character encoding for the email.
  const charset = "UTF-8";

  // Specify the parameters to pass to the API.
  const params = { 
    Source: sender, 
    Destination: { 
      ToAddresses: [
        recipient 
      ],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: charset
      },
      Body: {
        Text: {
          Data: body_text,
          Charset: charset 
        },
        Html: {
          Data: body_html,
          Charset: charset
        }
      }
    },
    // ConfigurationSetName: configuration_set
  };

  //Try to send the email.
  console.log(`Sending email from ${sender} to ${recipient}`)
  return new Promise((resolve, reject) => {
    ses.sendEmail(params, function(err, data) {
      // If something goes wrong, print an error message.
      if(err) {
        console.log(err.message);
        reject(err);
      } else {
        console.log("Email sent! Message ID: ", data.MessageId);
        resolve(data);
      }
    });
  })

}

function localeString(x, sep, grp) {
  const sx = (''+x).split('.');
  let s = ''; 
  let i, j;
  sep || (sep = '.'); // default seperator
  grp || grp === 0 || (grp = 3); // default grouping
  i = sx[0].length;
  while (i > grp) {
      j = i - grp;
      s = sep + sx[0].slice(j, i) + s;
      i = j;
  }
  s = sx[0].slice(0, i) + s;
  sx[0] = s;
  return sx.join('.');
}

exports.handler = async (event) => {
  console.log(event)
  await sendEmail(event);
  return 'done'
};