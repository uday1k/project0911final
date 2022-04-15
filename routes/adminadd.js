const express = require('express');
const router = express.Router();
var app = require('../app')
var createError=require('http-errors');
var dbo;
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    dbo = db.db("onlinejob");
});


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

router.post('/skill', function (req, res) {
    async function asAddSkillFunc() {
        await dbo.collection("skillsTypes").insertOne({ "skillName": req.body.skillname }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })
    }
    asAddSkillFunc();
})

router.post('/role', function (req, res) {
    async function asAddRoleFunc() {
        await dbo.collection("roleTypes").insertOne({ "roleName": req.body.rolename }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })
    }
    asAddRoleFunc();

})

router.post('/department', function (req, res) {
    async function asAddDeptFunc() {
        await dbo.collection("departmentTypes").insertOne({ "departmentName": req.body.departmentname }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })
    }
    asAddDeptFunc();

})


router.post('/qualification', function (req, res) {
    async function asAddQualFunc() {
        await dbo.collection("Qualifications").insertOne({ "qualificationName": req.body.qualificationname }, function (err, resultOfInsrt) {
            res.redirect("/admin/addoptions");
        })
    }
    asAddQualFunc();

})

module.exports = router;