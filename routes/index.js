const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();

const passport = require('passport');










router.get('/logingoogle', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/callback', passport.authenticate('google', { scope: ['email', 'profile'], failureRedirect: '/error' }), async (req, res) => {

  const data = await dbo.collection("Credentials").findOne({ emailid: req.user.emailid.value });
  req.user.account = data;
  return res.redirect('/?flash=succesfully loggedIn');
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function (req, res) {
  res.redirect('/');
});


router.get('/logout', function (req, res) {
  req.logOut();
  req.session = null;
  res.redirect("/");
})
router.post('/checkEmail', async function (req, res) {
  const result = await dbo.collection("Credentials").findOne({ emailid: req.body[0].value });
  if (result)
    res.send("emailFound");
  else
    res.send("formSubmitted");
})


router.get('/register', function (req, res) {

  res.render('registerLocal')

})

router.post('/registerdata', async function (req, res) {
  const data = {}
  data.role = req.body.typeOfAccount;
  data.active = true;
  data.companyName = req.body.company_name;
  if (req.isAuthenticated()) {
    data.emailid = req.user.emailid.value;
    data.userName = req.user.displayName;
    req.user.account = data;

  }
  else {

    hash = bcrypt.hash(req.body.user_password, 10);
    data.password = await hash;
    data.emailid = req.body.user_email;
    data.userName = req.body.user_username;
  }


  await dbo.collection("Credentials").insertOne(data)
  if (req.body.company_name) {
    let insertCompanyDetails = {};
    insertCompanyDetails.companyName = req.body.company_name;
    if (req.isAuthenticated()) {
      insertCompanyDetails.companyEmail = req.user.emailid.value;
    }
    else {
      insertCompanyDetails.companyEmail = req.body.user_email;


    }

    insertCompanyDetails.status = "pending";
    insertCompanyDetails.registeredOnDateTime = new Date().toLocaleString();
    insertCompanyDetails.companyId = new Date().getTime() + "" + Math.floor(100000 + Math.random() * 900000);
    await dbo.collection("Companies").insertOne(insertCompanyDetails, function (err, result) {
      if (err) throw err;
      res.redirect('/?flash=Company Successfully Registered')
    })

  }
  else {
    res.redirect('/');
  }



})





router.use((req, res, next) => {
  if (!(req.isAuthenticated())) {
    res.locals.auth = null;
    res.locals.role = null;
    res.locals.flash = req.query.flash || null;
    res.locals.companyName = null;
    next();
  }
  else {
    if (req.user.account && req.user.account.role) {
      res.locals.auth = req.user.id || null;
      res.locals.role = req.user.account.role || null;
      res.locals.flash = req.query.flash || null;
      res.locals.companyName = req.user.account.companyName || null;
      res.locals.image = req.user.image || null;
      next();
    }
    else {
      res.render('register')
    }
  }
})




router.get('/', paginatedMacthedResults(), function (req, res) {

  let indexValues = {}

  indexValues.next = res.paginatedResults.next;
  indexValues.previous = res.paginatedResults.previous;
  indexValues.pageNo = res.paginatedResults.pageNo;

  if (res.paginatedResults.next)
    indexValues.nextURL = "/?search_value=" + req.query.search_value + "&page=" + res.paginatedResults.next.page;
  if (res.paginatedResults.previous)
    indexValues.prevURL = "/?search_value=" + req.query.search_value + "&page=" + res.paginatedResults.previous.page;
  if (req.query.search_value === "undefined")
    indexValues.search_id_value = undefined;
  else
    indexValues.search_id_value = req.query.search_value;

  indexValues.rorj = res.paginatedResults.results;
  res.render("index", indexValues);

})

router.get('/courses', function (req, res) {
  res.render("courses");
})


function paginatedMacthedResults() {

  return async (req, res, next) => {

    model = []
    let skillsearch = req.query.search_value;
    if ((!(skillsearch)) || skillsearch === "undefined") {
      const aggCursor = dbo.collection("jobsDetails").aggregate();
      for await (const doc of aggCursor) {
        model.push(doc);
      }
    }
    else {
      skillsearch = skillsearch.replaceAll(",", " ")
      const aggCursor = dbo.collection("jobsDetails").aggregate([{ $match: { $text: { $search: skillsearch } } }, { $sort: { score: { $meta: "textScore" } } }])
      for await (const doc of aggCursor) {
        model.push(doc);
      }
    }
    const limit = 6;
    let page;
    if (req.query.page) {
      page = parseInt(req.query.page);
    }
    else {
      page = 1;
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};
    if (endIndex < model.length) {
      results.next = {
        page: page + 1,
        limit: limit
      };
    }

    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      };
    }
    results.pageNo = page;
    results.results = model.slice(startIndex, endIndex);

    res.paginatedResults = results;
    next();

  }
}

router.get('/getsearch', paginatedMacthedResults(), async function (req, res) {
  res.json(res.paginatedResults)
})


router.post('/gethints', async function (req, res) {
  let hintValues = []
  let skills = dbo.collection("skillsTypes").find({ skillName: { $regex: req.body[0], $options: "i" } }).toArray();
  let companies = dbo.collection("Companies").find({ companyName: { $regex: req.body[0], $options: "i" } }).toArray();

  let hints = await Promise.all([skills, companies])

  await Promise.all([
    hints[0].forEach(o => { hintValues.push(o.skillName); }),
    hints[1].forEach(o => { hintValues.push(o.companyName); })
  ])
  res.send(hintValues);

})


router.get('/login', function (req, res) {
  res.render("loginpag", { "loginCheckDet": "", "colorOfSpan": true });
})



router.post('/checklogin', async function (req, res) {

  const login_email_value = req.body[0].value;
  const login_password_value = req.body[1].value;

  const result = await dbo.collection("Credentials").findOne({ emailid: login_email_value });


  if (result === null) {
    res.send("emailNotFound")
  }
  else if (!(result.password)) {
    res.send("noPassword")
  }
  else {
    bcrypt.compare(login_password_value, result.password).then(function (resultOfPasswordComparison) {
      if (resultOfPasswordComparison) {
        res.send("formSubmitted")
      }
      else {
        res.send("incorrectPassword")
      }
    })
  }

});

router.get('/view/:id', async (req, res) => {

  try {
    let data = await dbo.collection("jobsDetails").findOne({ _id: ObjectId(req.params.id) });
    res.render('jobDetails', { data: data });
  }
  catch (error) {
    res.send(error.message);

  }



})







module.exports = router;