const express = require('express');
const router = express.Router();
var createError = require('http-errors');

var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();

router.use((req, res, next) => {
  if (!(req.session.auth)) {
    res.render("loginpag", { "loginCheckDet": "Session Expired! Login Again", "colorOfSpan": true });
  }
  else if (req.session.role === "admin") {
    next();
  }
  else {
    return next(createError(403, 'Only authorized user can view this page.'))
  }
})

router.get('/', async function (req, res) {

  res.locals.auth = req.session.auth;
  res.locals.role = req.session.role;
  res.locals.flashesValues = req.flash('checkFlash');
  

    let skillAggregate = await dbo.collection("jobsDetails").aggregate([
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
    let dataCountBySkillName = []
    let dataCountBySkillValue = []
    for await (const doc of skillAggregate) {
      dataCountBySkillName.push(doc._id);
      dataCountBySkillValue.push(doc.count);
    }
    let adminPageValues={}
    adminPageValues.skillNames=(dataCountBySkillName);
    adminPageValues.skillValues=JSON.stringify(dataCountBySkillValue);
    res.render('admin', adminPageValues);


})

router.get('/companylist',async function (req, res) {
  var companyData = {};
  const companyList = new Promise(function (resolve, reject) {
    dbo.collection("Companies").find({}).toArray(function (err, companiesList) {
      if (err) reject(err);
      else resolve(companiesList);
    })
  })
  
    companyData.companyList = await companyList
    res.render('adminCompanies', companyData);
  

})

router.get('/addoptions', async function (req, res) {
  optionsData = {};
  const skillsTypes = dbo.collection("skillsTypes").find({}).toArray()
  
  const roleTypes = dbo.collection("roleTypes").find({}).toArray();

  const deptTypes = dbo.collection("departmentTypes").find({}).toArray()
  
  const quals = dbo.collection("Qualifications").find({}).toArray()
  
    let result = await Promise.all([skillsTypes, roleTypes, deptTypes, quals])
    optionsData.typesOfSkills=result[0]
    optionsData.typesOfRoles=result[1]
    optionsData.typesOfDepts=result[2]
    optionsData.quals=result[3]
    res.render('adminAddOptions', optionsData);

})






module.exports = router;