const express = require('express');
const router = express.Router();
var app = require('../app');
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

router.get('/',function(req,res){
    
    res.locals.auth=req.session.auth;
    res.locals.role=req.session.role;
    res.locals.flashesValues=req.flash('checkFlash');
    async function funcSkillAggr(){

        let skillAggregate=await dbo.collection("jobsDetails").aggregate([
          {
            '$unwind': {
              'path': '$skillsRequired'
            }
          }, {
            '$group': {
              '_id': '$skillsRequired', 
              'count': {
                '$sum': 1
              }
            }
          }
        ])
        dataCountBySkillName=[]
        dataCountBySkillValue=[]
        for await (const doc of skillAggregate) { 
          dataCountBySkillName.push(doc._id);
          dataCountBySkillValue.push(doc.count);
        }
    res.render('admin',{"skillNames":dataCountBySkillName,"skillValues":dataCountBySkillValue});
      
      

    }
    
    funcSkillAggr();
    
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