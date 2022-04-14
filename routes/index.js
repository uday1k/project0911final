const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { ObjectId } = require('mongodb');
var dbo;
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    dbo = db.db("onlinejob");
});


router.get('/', function (req, res) {
  res.locals.auth=req.session.auth;
  res.locals.role=req.session.role;
  res.locals.sucessfullyRegisteredCheck=req.flash('checkFlash');
  async function asRetriveJobs(){
    await dbo.collection("jobsDetails").find({}).toArray(function(err,retrivedValues){
      if(err) throw err;
      let indexValues={}
      indexValues.rorj=retrivedValues;
      res.render("index",indexValues);
    })
  }
  asRetriveJobs();
})

router.get('/courses',function(req,res){
  res.locals.auth=req.session.auth;
  res.locals.role=req.session.role;
  res.render("courses");
})







router.get('/login', function (req, res) {
  req.session.auth = false;
  res.render("loginpag", { "loginCheckDet": "", "colorOfSpan": true });
})




router.post('/validatelogin', function (req, res) {

  
  const userData = new Promise(function (resolve, reject) {
    dbo.collection("Users").findOne({ userEmail: req.body.login_email }, function (err, result) {
      if (err) {
        reject(err);
      }
      else {
        resolve(result);
      }
    });

  })

  const companyData=new Promise(function(resolve,reject){
    dbo.collection("Companies").findOne({ companyEmail: req.body.login_email }, function (err, result) {
      if (err) {
        reject(err);
      }
      else {
        resolve(result);
      }
    });
  })

  const adminData=new Promise(function(resolve,reject){
    dbo.collection("Admins").findOne({ adminEmail: req.body.login_email }, function (err, result) {
      if (err) {
        reject(err);
      }
      else {
        resolve(result);
      }
    });
  })

async function asCredValidateFunc() {
  let result = await Promise.all([userData,companyData,adminData])


  if (result[0]===null && result[1]==null && result[2]==null) {
    res.render("loginpag", { "loginCheckDet": "Email ID Not Found", "colorOfSpan": true });
  }
  else if(result[2]!=null){
    //bcrypt.compare(req.body.login_password, result[2].adminPassword).then(function(resultOfPasswordComparison) {
      if(result[2].adminPassword===req.body.login_password){
        res.locals.auth=req.session.auth=true;
        res.locals.role=req.session.role="admin";
        req.flash('checkFlash','succesfully loggedIn');
        res.redirect('/admin');
      }
      else{
        res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });
      }
    //})
  }
  else if(result[0]===null){
        if(result[1].status!="accepted"){
          res.render("loginpag", { "loginCheckDet": "You are not Approved!", "colorOfSpan": true });
        }
        else{
              bcrypt.compare(req.body.login_password, result[1].companyPassword).then(function(resultOfPasswordComparison) {
                if(resultOfPasswordComparison){
                  res.locals.auth=req.session.auth=true;
                  res.locals.role=req.session.role="company";
                  res.locals.companyName=req.session.companyName=result[1].companyName;
                  req.flash('checkFlash','succesfully loggedIn');
                  res.redirect('/');
                }
                else{
                  res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });
                }
              })
            }
  }
  else if(result[1]===null){
        
    bcrypt.compare(req.body.login_password, result[0].userPassword).then(function(resultOfPasswordComparison) {
      if(resultOfPasswordComparison){
        res.locals.auth=req.session.auth=true;
        res.locals.role=req.session.role="user";
        req.flash('checkFlash','succesfully loggedIn');
        res.redirect('/');
      }
      else{
        res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });

      }

    })
          

  }
  else {
    
  }
}



asCredValidateFunc();

});



router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect("/");
})


module.exports = router;
