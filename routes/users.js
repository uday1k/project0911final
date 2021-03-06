const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10;

var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();




router.get('/register', function (req, res) {
  let registerCheckUser = {}
  registerCheckUser.checkFails = "";
  res.render('registerUser', registerCheckUser);
})

router.post('/register/:id?', async function (req, res) {
  let id = req.params.id;
  if (!(id)) {
    let insertUserDetails = {};
    insertUserDetails.userName = req.body.user_username;
    insertUserDetails.userEmail = req.body.user_email;
    
    const userData = dbo.collection("Users").findOne({ userEmail: req.body.user_email })
    const companyData = dbo.collection("Companies").findOne({ companyEmail: req.body.user_email })

    let result = await Promise.all([userData, companyData])
    if (result[0] === null && result[1] === null) {
      await bcrypt.hash(req.body.user_password, saltRounds).then(function (hash) {
        insertUserDetails.userPassword = hash;
      });
      insertUserDetails.registeredOnDateTime = new Date().toLocaleString();
      insertUserDetails.id = new Date().getTime() + "" + Math.floor(100000 + Math.random() * 900000);

      await dbo.collection("Users").insertOne(insertUserDetails, function (err, result) {
        if (err) throw err;

        res.redirect('/')
      })
    }
    else {
      let registerCheckUser = {}
      registerCheckUser.checkFails = "Email ID already Exists";
      res.render('registerUser', registerCheckUser);

    }

  }
  else if (!(id)) {
    res.send('error no id but there is type');

  }

})

router.post('/checkuserdetails', async function (req, res) {


  const register_email_value = req.body[1].value;

  const userData = dbo.collection("Users").findOne({ userEmail: register_email_value })

  const companyData = dbo.collection("Companies").findOne({ companyEmail: register_email_value })
  
    let result = await Promise.all([userData, companyData])
    if (result[0] === null && result[1] === null) {
      res.send("noUserFound");
    }
    else {
      res.send("emailFound");
    }
  
})

module.exports = router;