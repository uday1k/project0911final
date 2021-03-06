const express = require('express');
const router = express.Router();
var createError = require('http-errors');



var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();


router.use(async (req, res, next) => {
  if (!(req.isAuthenticated())) {
    res.locals.auth = null;
    res.locals.role = null;
    res.locals.flash = null;
    res.locals.companyName = null;
    return next(createError(403, 'Please sign in to view this page.'));
  }
  else {
    if (req.user.account && req.user.account.role === "admin") {
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


  let CTCAggregate = await dbo.collection("jobsDetails").aggregate([
    {
      '$project': {
        'ctcOffered': 1
      }
    }, {
      '$group': {
        '_id': '$ctcOffered',
        'count': {
          '$sum': 1
        }
      }
    }
  ])
  ctcRangeCount = [0, 0, 0, 0, 0]
  for await (const doc of CTCAggregate) {

    if (parseFloat(doc._id) < 5) {
      ctcRangeCount[0] += doc.count;
    }
    else if (parseFloat(doc._id) >= 5 && parseFloat(doc._id) < 10) {
      ctcRangeCount[1] += doc.count;
    }
    else if (parseFloat(doc._id) >= 10 && parseFloat(doc._id) < 20) {
      ctcRangeCount[2] += doc.count;
    }
    else if (parseFloat(doc._id) >= 20 && parseFloat(doc._id) < 30) {
      ctcRangeCount[3] += doc.count;
    }
    else {
      ctcRangeCount[4] += doc.count;
    }
  }

  adminPageValues.ctcRangeCount = JSON.stringify(ctcRangeCount);

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