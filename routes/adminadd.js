const express = require('express');
const router = express.Router();
var createError=require('http-errors');


const jwt = require('jsonwebtoken');

var mongoUtil = require( './mongoDB' );
var dbo = mongoUtil.getDb();


router.use((req, res, next) => {


    if (!(req.cookies.token)) {
      res.locals.auth = null;
      res.locals.role = null;
      res.locals.flash = null;
      res.locals.companyName = null;
      res.redirect("/login");
    }
    else {
  
      let jwtSecretKey = process.env.JWT_SECRET_KEY;
      const token = req.cookies.token;
      verified = jwt.verify(token, jwtSecretKey, function (err, result) {
        return result
      })
  
      res.locals.auth = verified.auth || null;
      res.locals.role = verified.role || null;
      res.locals.flash = req.query.flash || null;
      res.locals.companyName = verified.companyName || null;
  
      if (res.locals.role === "admin") {
        next();
      }
      else {
        return next(createError(403, 'Only authorized user can view this page.'));
      }
    }
  })

router.post('/skill',async function (req, res) {
    
       await  dbo.collection("skillsTypes").insertOne({ "skillName": req.body.skillname }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })
})

router.post('/role', async function (req, res) {
    
        await dbo.collection("roleTypes").insertOne({ "roleName": req.body.rolename }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })
   

})

router.post('/department',async function (req, res) {
    
        await dbo.collection("departmentTypes").insertOne({ "departmentName": req.body.departmentname }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })
    

})


router.post('/qualification',async function (req, res) {
    
        await dbo.collection("Qualifications").insertOne({ "qualificationName": req.body.qualificationname }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })

})

module.exports = router;