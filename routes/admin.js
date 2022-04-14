const express = require('express');
const router = express.Router();
var test = require('../app')


var dbo;
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  dbo = db.db("onlinejob");
});


router.get('/',function(req,res){
  
    res.locals.auth=req.session.auth;
    res.locals.role=req.session.role;
    res.locals.sucessfullyRegisteredCheck=req.flash('checkFlash');

    res.render('admin');
})

router.get('/companylist', function (req, res) {
    var companyData = {};
    const companyList = new Promise(function (resolve, reject) {
      dbo.collection("Companies").find({}).toArray(function (err, companiesList) {
        if (err) reject(err);
        else resolve(companiesList);
      })
    })
    async function asFuncCompDisplay() {
      [companyData.companyList] = await Promise.all([companyList])
      res.render('adminCompanies', companyData);
    }
    asFuncCompDisplay();
  
  })

router.get('/addoptions',function(req,res){
    optionsData={};
    const skillsTypes = new Promise(function (resolve, reject) {
        dbo.collection("skillsTypes").find({}).toArray(function (err, skillTypes) {
          if (err) reject(err);
          else resolve(skillTypes);
        })
    
      })
      const roleTypes = new Promise(function (resolve, reject) {
        dbo.collection("roleTypes").find({}).toArray(function (err, roleTypes) {
          if (err) reject(err);
          else resolve(roleTypes);
        })
    
      })
      const deptTypes = new Promise(function (resolve, reject) {
        dbo.collection("departmentTypes").find({}).toArray(function (err, deptTypes) {
          if (err) reject(err);
          else resolve(deptTypes);
        })
      })
      const quals = new Promise(function (resolve, reject) {
        dbo.collection("Qualifications").find({}).toArray(function (err, qualsres) {
          if (err) reject(err);
          else resolve(qualsres);
        })
      })
      async function asFuncOptionsDisplay() {
        [optionsData.typesOfSkills, optionsData.typesOfRoles, optionsData.typesOfDepts,optionsData.quals] = await Promise.all([skillsTypes, roleTypes, deptTypes,quals])
        res.render('adminAddOptions', optionsData);
      }
      asFuncOptionsDisplay();
})
  





module.exports=router;