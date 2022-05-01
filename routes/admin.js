const express = require('express');
const router = express.Router();
var createError = require('http-errors');
const jwt = require('jsonwebtoken');



var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();

router.use((req, res, next) => {


  if (!(req.cookies.token)) {
    res.locals.auth = null;
    res.locals.role = null;
    res.locals.flash = null;
    res.locals.companyName = null;
    return next(createError(403, 'Only authorized user can view this page.'));
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

router.get('/', async function (req, res) {

console.log(res.locals)
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
  let adminPageValues = {}
  adminPageValues.skillNames = (dataCountBySkillName);
  adminPageValues.skillValues = JSON.stringify(dataCountBySkillValue);
  res.render('admin', adminPageValues);


})

router.get('/companylist', async function (req, res) {
  var companyData = {};
  companyData.companyList = await dbo.collection("Companies").find({}).toArray();
  res.render('adminCompanies', companyData);


})

router.get('/addoptions', async function (req, res) {
  optionsData = {};
  const skillsTypes = dbo.collection("skillsTypes").find({}).toArray()

  const roleTypes = dbo.collection("roleTypes").find({}).toArray();

  const deptTypes = dbo.collection("departmentTypes").find({}).toArray()

  const quals = dbo.collection("Qualifications").find({}).toArray()

  let result = await Promise.all([skillsTypes, roleTypes, deptTypes, quals])
  optionsData.typesOfSkills = result[0]
  optionsData.typesOfRoles = result[1]
  optionsData.typesOfDepts = result[2]
  optionsData.quals = result[3]
  res.render('adminAddOptions', optionsData);

})






module.exports = router;