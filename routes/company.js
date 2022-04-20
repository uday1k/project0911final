const express = require('express');
const router = express.Router();
var createError = require('http-errors');
var app = require('../app')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { ObjectId } = require('mongodb');
var mongoUtil = require( './mongoDB' );
var dbo = mongoUtil.getDb();




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


router.get('/myjobs', checkCompanyAuth,function (req, res) {
  res.locals.auth=req.session.auth;
  res.locals.role=req.session.role;
  async function asRetriveMyJobs(){
    await dbo.collection("jobsDetails").aggregate([ { $match : { companyName : req.session.companyName } } ]).toArray(function(err,retrivedValues){
      if(err) throw err;
      let myJobValues={}
      myJobValues.rorj=retrivedValues;
      res.render("myJobs",myJobValues);
    })
  }
  asRetriveMyJobs();
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




router.post('/checkcompanydetails', function (req, res) {
  
  const register_company_name_value=req.body[0].value;
  const register_email_value=req.body[1].value;  
  const userData = new Promise(function (resolve, reject) {
      dbo.collection("Users").findOne({ userEmail: register_email_value }, function (err, result) {
        if (err) {
          reject(err);
        }
        else {
          resolve(result);
        }
      });

    })

    const companyData = new Promise(function (resolve, reject) {
      dbo.collection("Companies").findOne({ companyEmail: register_email_value }, function (err, result) {
        if (err) {
          reject(err);
        }
        else {
          resolve(result);
        }
      });
    })
    const companyDataNameCheck = new Promise(function (resolve, reject) {
      dbo.collection("Companies").findOne({ companyName: register_company_name_value }, function (err, result) {
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
        res.send("companyFound");
      }
      else if (result[0] === null && result[1] === null) {
        res.send("noCompanyFound"); 
      }
      else {
        res.send("emailFound");
      }
    }
    asRegisterCompanyDetails();
  

})



router.get('/insertjob/:idofjob?',checkCompanyAuth, function (req, res) {
    let idofjob=req.params.idofjob;

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

    if(!(idofjob))
    {
            let jobDetails = {};
          
          async function asFuncEnterJobDetails() {
            [jobDetails.typesOfSkills, jobDetails.typesOfRoles, jobDetails.typesOfDepts, jobDetails.quals] = await Promise.all([skillsTypes, roleTypes, deptTypes, quals])
            jobDetails.departmetSelected=null;
            jobDetails.roleSelected=null;
            jobDetails.qualificationSelected=null;
            jobDetails.jobDescriptionGiven=null;
            jobDetails.skillsSelected=null;
            jobDetails.experienceGiven=null;
            jobDetails.lastDateTimeToApplyGiven=null;
            jobDetails.ctcMentioned=null;
            jobDetails._id=null;
            res.render('formpage', jobDetails);
          }
          asFuncEnterJobDetails();
    }
    else{


      const jobDetailsofIDPromise = new Promise(function (resolve, reject) {
        dbo.collection("jobsDetails").findOne({ "_id": ObjectId(idofjob)},function (err, jobres) {
          if (err) reject(err);
          else resolve(jobres);
        })
      })

      let jobDetails = {};

          
          async function asFuncUpdateJobDetails() {
            

            [jobDetails.typesOfSkills, jobDetails.typesOfRoles, jobDetails.typesOfDepts, jobDetails.quals] = await Promise.all([skillsTypes, roleTypes, deptTypes, quals])
            let jobDetailsofID=await jobDetailsofIDPromise;
            console.log(jobDetailsofID);
            jobDetails.departmetSelected=jobDetailsofID.deptType;
            jobDetails.roleSelected=jobDetailsofID.roleType;
            jobDetails.qualificationSelected=jobDetailsofID.qualificationRequired;
            jobDetails.jobDescriptionGiven=jobDetailsofID.jobDescription;
            jobDetails.skillsSelected=jobDetailsofID.skillsRequired;
            jobDetails.experienceGiven=jobDetailsofID.experience;
            let dt=jobDetailsofID.lastDateTimeToApply;
            let datech=(dt.slice(6,10)+'-'+dt.slice(3,5)+'-'+dt.slice(0,2)+'T'+dt.slice(12,14)+':'+dt.slice(15,17));
            jobDetails.lastDateTimeToApplyGiven=datech;
            jobDetails.ctcMentioned=jobDetailsofID.ctcOffered;
            jobDetails._id=jobDetailsofID._id;
            res.render('formpage', jobDetails);
          }
          asFuncUpdateJobDetails();
      
    }


})




router.post('/savejob', checkCompanyAuth,function (req, res) {
  if(!(req.body.jobmongoid)){
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
        req.flash('checkFlash','Job Successfully Published');
        res.redirect("/");
      })
    }
    asFuncInsertJobDetails();
  }
  else{
    let ObjectContainingIDtobeEffected = { "_id": ObjectId(req.body.jobmongoid) };
    let newvalues={};
    newvalues = { $set: {   deptType: req.body.jobdept,roleType : req.body.jobrole,qualificationRequired : req.body.jobqual
                                ,jobDescription : req.body.jobdes
                                ,skillsRequired : req.body.jobskillsrequired
                                ,experience : req.body.jobexp
                                ,lastDateTimeToApply : new Date(req.body.jobdatetime).toLocaleString()
                                ,ctcOffered : req.body.jobctc
                              }
                  }
    
                  async function asFuncUpdateJobDetails() {
                    await  dbo.collection("jobsDetails").updateOne(ObjectContainingIDtobeEffected,newvalues,function (err, resultToCheckDetailsInserted) {
                      if (err) throw err;
                      req.flash('checkFlash','Job Successfully Updated');
                      res.redirect("/");
                    })
                  }
                  asFuncUpdateJobDetails();

  }
  

})

module.exports = router;