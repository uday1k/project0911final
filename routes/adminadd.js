const express = require('express');
const router = express.Router();
var createError=require('http-errors');

var mongoUtil = require( './mongoDB' );
var dbo = mongoUtil.getDb();


router.use((req, res, next) => {
    if (!(req.session.auth)) {
      res.render("loginpag", { "loginCheckDet": "Session Expired! Login Again", "colorOfSpan": true });
    }
    else if(req.session.role === "admin") {
      next();
    }
    else{
        return next(createError(403, 'Only authorized user can view this page.'))
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