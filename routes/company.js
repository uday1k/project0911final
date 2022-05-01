const express = require('express');
const router = express.Router();
var createError = require('http-errors');



const jwt = require('jsonwebtoken');


const bcrypt = require('bcrypt');
const saltRounds = 10;
const { ObjectId } = require('mongodb');

var transporter=require("./emailsent")

var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();




const checkCompanyAuth = (req, res, next) => {


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

    if (res.locals.role === "company") {
      next();
    }
    else {
      return next(createError(403, 'Only authorized user can view this page.'));
    }
  }

}


router.get('/myjobs', checkCompanyAuth, async function (req, res) {
  
  await dbo.collection("jobsDetails").aggregate([{ $match: { companyName: res.locals.companyName } }]).toArray(function (err, retrivedValues) {
    if (err) throw err;
    let myJobValues = {}
    myJobValues.rorj = retrivedValues;
    res.render("myJobs", myJobValues);
  })

})

router.get('/register', function (req, res) {
  let registerCheckCompany = {}
  registerCheckCompany.checkFails = "";
  res.render('registerCompany', registerCheckCompany);
})

router.post('/register/:type?/:id?', async function (req, res) {
  let id = req.params.id;
  let type = req.params.type;
  if (!(id && type)) {
    let insertCompanyDetails = {};
    insertCompanyDetails.companyName = req.body.comp_company_name;
    insertCompanyDetails.companyEmail = req.body.comp_email;
    insertCompanyDetails.status = "pending";

    const userData = dbo.collection("Users").findOne({ userEmail: req.body.comp_email });
    const companyData = dbo.collection("Companies").findOne({ companyEmail: req.body.comp_email });
    const companyDataNameCheck = dbo.collection("Companies").findOne({ companyName: req.body.comp_company_name });




    let result = await Promise.all([userData, companyData]);
    let companyDataNameCheckResult = await companyDataNameCheck;
    if (companyDataNameCheckResult != null) {
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
        res.redirect('/?flash=Company Successfully Registered')
      })
    }
    else {
      let registerCheckCompany = {}
      registerCheckCompany.checkFails = "Email ID already Exists";
      res.render('registerCompany', registerCheckCompany);
    }

  }
  else if (type && !(id)) {
    res.send('error no id but there is type');

  }
  else {

    const companyDetails=await dbo.collection('Companies').findOne({ "_id": ObjectId(id) })
    await dbo.collection('Companies').updateOne({ "_id": ObjectId(id) }, { $set: { status: type } }, function (err, resultOfUpdt) {
      let mailOptions = {
        from: 'kommineniuday449@gmail.com',
        to: companyDetails.companyEmail,
        subject: 'Company Status',
        text: companyDetails.companyName+" status is updated to "+type,
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      res.redirect('/admin/companylist')
    })


  }

})




router.post('/checkcompanydetails', async function (req, res) {

  const register_company_name_value = req.body[0].value;
  const register_email_value = req.body[1].value;

  const userData = dbo.collection("Users").findOne({ userEmail: register_email_value });
  const companyData = dbo.collection("Companies").findOne({ companyEmail: register_email_value });
  const companyDataNameCheck = dbo.collection("Companies").findOne({ companyName: register_company_name_value });


  let result = await Promise.all([userData, companyData]);
  let companyDataNameCheckResult = await companyDataNameCheck;
  if (companyDataNameCheckResult != null) {
    res.send("companyFound");
  }
  else if (result[0] === null && result[1] === null) {
    res.send("noCompanyFound");
  }
  else {
    res.send("emailFound");
  }



})



router.get('/insertjob/:idofjob?', checkCompanyAuth, async function (req, res) {
  let idofjob = req.params.idofjob;

  const skillsTypes = dbo.collection("skillsTypes").find({}).toArray();
  const roleTypes = dbo.collection("roleTypes").find({}).toArray();
  const deptTypes = dbo.collection("departmentTypes").find({}).toArray();
  const quals = dbo.collection("Qualifications").find({}).toArray()

  if (!(idofjob)) {
    let jobDetails = {};


    [jobDetails.typesOfSkills, jobDetails.typesOfRoles, jobDetails.typesOfDepts, jobDetails.quals] = await Promise.all([skillsTypes, roleTypes, deptTypes, quals])
    jobDetails.departmetSelected = null;
    jobDetails.roleSelected = null;
    jobDetails.qualificationSelected = null;
    jobDetails.jobDescriptionGiven = null;
    jobDetails.skillsSelected = null;
    jobDetails.urlGiven = null;
    jobDetails.experienceGiven = null;
    jobDetails.lastDateTimeToApplyGiven = null;
    jobDetails.ctcMentioned = null;
    jobDetails._id = null;
    res.render('formpage', jobDetails);

  }
  else {


    const jobDetailsofIDPromise = dbo.collection("jobsDetails").findOne({ "_id": ObjectId(idofjob) })

    let jobDetails = {};


    [jobDetails.typesOfSkills, jobDetails.typesOfRoles, jobDetails.typesOfDepts, jobDetails.quals] = await Promise.all([skillsTypes, roleTypes, deptTypes, quals])
    let jobDetailsofID = await jobDetailsofIDPromise;
    console.log(jobDetailsofID);
    jobDetails.departmetSelected = jobDetailsofID.deptType;
    jobDetails.roleSelected = jobDetailsofID.roleType;
    jobDetails.qualificationSelected = jobDetailsofID.qualificationRequired;
    jobDetails.jobDescriptionGiven = jobDetailsofID.jobDescription;
    jobDetails.skillsSelected = jobDetailsofID.skillsRequired;
    jobDetails.urlGiven = jobDetailsofID.jobURL;
    jobDetails.experienceGiven = jobDetailsofID.experience;
    let dt = jobDetailsofID.lastDateTimeToApply;
    let datech = (dt.slice(6, 10) + '-' + dt.slice(3, 5) + '-' + dt.slice(0, 2) + 'T' + dt.slice(12, 14) + ':' + dt.slice(15, 17));
    jobDetails.lastDateTimeToApplyGiven = datech;
    jobDetails.ctcMentioned = jobDetailsofID.ctcOffered;
    jobDetails._id = jobDetailsofID._id;
    res.render('formpage', jobDetails);


  }


})




router.post('/savejob', checkCompanyAuth, async function (req, res) {
  if (!(req.body.jobmongoid)) {
    let insertJobDetails = {};
    insertJobDetails.deptType = req.body.jobdept;
    insertJobDetails.roleType = req.body.jobrole;
    insertJobDetails.qualificationRequired = req.body.jobqual;
    insertJobDetails.jobDescription = req.body.jobdes;
    insertJobDetails.skillsRequired = req.body.jobskillsrequired;
    insertJobDetails.jobURL=req.body.joburl;
    insertJobDetails.experience = req.body.jobexp;
    insertJobDetails.lastDateTimeToApply = new Date(req.body.jobdatetime).toLocaleString();
    insertJobDetails.ctcOffered = req.body.jobctc;
    insertJobDetails.postedDateTime = new Date().toLocaleString();
    insertJobDetails.companyName = req.locals.companyName;

    await dbo.collection("jobsDetails").insertOne(insertJobDetails, function (err, resultToCheckDetailsInserted) {
      if (err) throw err;
      res.redirect("/?flash=Job Successfully Published");
    })
  }
  else {
    let ObjectContainingIDtobeEffected = { "_id": ObjectId(req.body.jobmongoid) };
    let newvalues = {};
    newvalues = {
      $set: {
        deptType: req.body.jobdept, roleType: req.body.jobrole, qualificationRequired: req.body.jobqual
        , jobDescription: req.body.jobdes
        , skillsRequired: req.body.jobskillsrequired
        , jobURL: req.body.joburl
        , experience: req.body.jobexp
        , lastDateTimeToApply: new Date(req.body.jobdatetime).toLocaleString()
        , ctcOffered: req.body.jobctc
      }
    }

    
      await dbo.collection("jobsDetails").updateOne(ObjectContainingIDtobeEffected, newvalues, function (err, resultToCheckDetailsInserted) {
        if (err) throw err;
        res.redirect("/?flash=Job Successfully Updated");
      })
    

  }


})

module.exports = router;