const express = require('express');
const router = express.Router();
var createError = require('http-errors');
var app = require('../app')
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



const checkCompanyAuth=(req, res, next) => {
  if (!(req.session.auth)) {
    res.render("loginpag", { "loginCheckDet": "Session Expired! Login Again", "colorOfSpan": true });
  }
  else if(req.session.role === "company") {
    next();
  }
  else{
    return next(createError(403, 'Only authorized user can view this page.'))
  }
}


router.get('/', function (req, res) {

})

router.get('/register', function (req, res) {
  let registerCheckCompany = {}
  registerCheckCompany.checkFails = "";
  res.render('registerCompany', registerCheckCompany);
})

router.post('/register/:type?/:id?', function (req, res) {
  let id = req.params.id;
  let type = req.params.type;
  if (!(id && type)) {
    let insertCompanyDetails = {};
    insertCompanyDetails.companyName = req.body.comp_company_name;
    insertCompanyDetails.companyEmail = req.body.comp_email;
    insertCompanyDetails.status = "pending"

    const userData = new Promise(function (resolve, reject) {
      dbo.collection("Users").findOne({ userEmail: req.body.comp_email }, function (err, result) {
        if (err) {
          reject(err);
        }
        else {
          resolve(result);
        }
      });

    })

    const companyData = new Promise(function (resolve, reject) {
      dbo.collection("Companies").findOne({ companyEmail: req.body.comp_email }, function (err, result) {
        if (err) {
          reject(err);
        }
        else {
          resolve(result);
        }
      });
    })
    const companyDataNameCheck = new Promise(function (resolve, reject) {
      dbo.collection("Companies").findOne({ companyName: req.body.comp_company_name }, function (err, result) {
        if (err) {
          reject(err);
        }
        else {
          resolve(result);
        }
      });
    })


    async function asRegisterCompanyDetails() {
      let result = await Promise.all([userData, companyData]);
      let companyDataNameCheckResult = await companyDataNameCheck;
      if (companyDataNameCheckResult!=null) {
        let registerCheckCompany = {}
        registerCheckCompany.checkFails = "Company Already Registered";
        res.render('registerCompany', registerCheckCompany);
      }
      else if (result[0] === null && result[1] === null) {
        await bcrypt.hash(req.body.comp_password, saltRounds).then(function (hash) {
          insertCompanyDetails.companyPassword = hash;
        });
        insertCompanyDetails.registeredOnDateTime = new Date().toLocaleString();
        insertCompanyDetails.companyId = new Date().getTime() + "" + Math.floor(100000 + Math.random() * 900000);
        await dbo.collection("Companies").insertOne(insertCompanyDetails, function (err, result) {
          if (err) throw err;
          res.redirect('/')
        })
      }
      else {
        let registerCheckCompany = {}
        registerCheckCompany.checkFails = "Email ID already Exists";
        res.render('registerCompany', registerCheckCompany);
      }
    }
    asRegisterCompanyDetails();
  }
  else if (type && !(id)) {
    res.send('error no id but there is type');

  }
  else {
    async function asUpdtStatusFunc() {
      await dbo.collection('Companies').updateOne({ "_id": ObjectId(id) }, { $set: { status: type } }, function (err, resultOfUpdt) {
        console.log(type);
        console.log(resultOfUpdt);
        res.redirect('/admin/companylist')
      })
    }
    asUpdtStatusFunc();

  }

})


router.get('/insertjob',checkCompanyAuth, function (req, res) {

  let jobDetails = {};



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

  async function asFuncEnterJobDetails() {
    [jobDetails.typesOfSkills, jobDetails.typesOfRoles, jobDetails.typesOfDepts, jobDetails.quals] = await Promise.all([skillsTypes, roleTypes, deptTypes, quals])
    res.render('formpage', jobDetails);
  }
  asFuncEnterJobDetails();


})




router.post('/savejob', function (req, res) {
  let insertJobDetails = {};
  insertJobDetails.deptType = req.body.jobdept;
  insertJobDetails.roleType = req.body.jobrole;
  insertJobDetails.qualificationRequired = req.body.jobqual;
  insertJobDetails.jobDescription = req.body.jobdes;
  insertJobDetails.skillsRequired = req.body.jobskillsrequired;
  insertJobDetails.experience = req.body.jobexp;
  insertJobDetails.lastDateTimeToApply = new Date(req.body.jobdatetime).toLocaleString();
  insertJobDetails.ctcOffered = req.body.jobctc;
  insertJobDetails.postedDateTime = new Date().toLocaleString();
  insertJobDetails.companyName=req.session.companyName;
  async function asFuncInsertJobDetails() {
    await dbo.collection("jobsDetails").insertOne(insertJobDetails, function (err, resultToCheckDetailsInserted) {
      if (err) throw err;
      console.log(resultToCheckDetailsInserted)
      res.redirect("/");
    })
  }
  asFuncInsertJobDetails();

})

module.exports = router;