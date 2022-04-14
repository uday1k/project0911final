var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kommineniuday449@gmail.com',
    pass: 'udayravi21'
  }
});


module.exports = transporter;