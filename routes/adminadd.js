const express = require('express');
const router = express.Router();
var createError=require('http-errors');
var mongoUtil = require( './mongoDB' );
var dbo = mongoUtil.getDb();




router.use((req, res, next) => {
  if (!(req.isAuthenticated())) {
    res.locals.auth = null;
    res.locals.role = null;
    res.locals.flash = null;
    res.locals.companyName = null;
    return next(createError(403, 'Please sign in to view this page.'));
  }
  else {
    if (req.user.account && req.user.account.role==="admin") {
      res.locals.auth = req.user.id || null;
      res.locals.role = req.user.account.role || null;
      res.locals.flash = req.query.flash || null;
      res.locals.companyName = req.user.account.companyName || null;
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