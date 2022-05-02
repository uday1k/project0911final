const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();




router.use((req, res, next) => {
  if (!(req.cookies.token)) {
    res.locals.auth=null;
    res.locals.role=null;
    res.locals.flash = null;
    res.locals.companyName=null;
    next();
  }
  else{
    
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    const token = req.cookies.token;

    verified = jwt.verify(token, jwtSecretKey, function (err, result) {
      return result
    })
    console.log(req.app.locals)
    res.locals.auth=verified.auth||null;
    res.locals.role=verified.role||null;
    res.locals.flash=req.query.flash||null;
    res.locals.companyName=verified.companyName||null;
    next();
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

  return (req, res, next) => {


    let skillsearch = req.query.search_value;
    if ((!(skillsearch)) || skillsearch === "undefined") {
      dbo.collection("jobsDetails").find({}).toArray(function (err, model) {


        const limit = 2;
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
      });
    }
    else {
      skillsearch = skillsearch.replaceAll(",", " ")
      let model = [];
      async function asRetriveSearch() {
        const aggCursor = dbo.collection("jobsDetails").aggregate([{ $match: { $text: { $search: skillsearch } } }, { $sort: { score: { $meta: "textScore" } } }])
        for await (const doc of aggCursor) {
          model.push(doc);
        }


        const limit = 2;
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
      asRetriveSearch();

    }
  }
}

router.get('/getsearch', paginatedMacthedResults(), async function (req, res) {
  let search_value = req.query.search_value;
  console.log(search_value)
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

  const userData = dbo.collection("Users").findOne({ userEmail: login_email_value })
  const companyData = dbo.collection("Companies").findOne({ companyEmail: login_email_value })
  const adminData = dbo.collection("Admins").findOne({ adminEmail: login_email_value });


  let result = await Promise.all([userData, companyData, adminData])


  if (result[0] === null && result[1] == null && result[2] == null) {
    res.send("emailNotFound")
  }
  else if (result[2] != null) {
    bcrypt.compare(login_password_value, result[2].adminPassword).then(function (resultOfPasswordComparison) {
      if (resultOfPasswordComparison) {
        res.send("formSubmitted")
      }
      else {
        res.send("incorrectPassword")
      }
    })
  }
  else if (result[0] === null) {
    if (result[1].status != "accepted") {
      res.send("notApproved")
    }
    else {
      bcrypt.compare(login_password_value, result[1].companyPassword).then(function (resultOfPasswordComparison) {
        if (resultOfPasswordComparison) {
          res.send("formSubmitted")
        }
        else {
          res.send("incorrectPassword")
        }
      })
    }
  }
  else if (result[1] === null) {

    bcrypt.compare(login_password_value, result[0].userPassword).then(function (resultOfPasswordComparison) {
      if (resultOfPasswordComparison) {
        res.send("formSubmitted")
      }
      else {
        res.send("incorrectPassword")
      }

    })


  }




});

router.post('/validatelogin', async function (req, res) {


  const userData = dbo.collection("Users").findOne({ userEmail: req.body.login_email })
  const companyData = dbo.collection("Companies").findOne({ companyEmail: req.body.login_email })
  const adminData = dbo.collection("Admins").findOne({ adminEmail: req.body.login_email })



  let result = await Promise.all([userData, companyData, adminData])


  if (result[0] === null && result[1] == null && result[2] == null) {
    res.render("loginpag", { "loginCheckDet": "Email ID Not Found", "colorOfSpan": true });
  }
  else if (result[2] != null) {
    bcrypt.compare(req.body.login_password, result[2].adminPassword).then(function (resultOfPasswordComparison) {
      if (resultOfPasswordComparison) {
        
        let jwtSecretKey = process.env.JWT_SECRET_KEY;
        let data = {
          email:req.body.login_email ,
          auth:true,
          role: "admin",
        }

        const token = jwt.sign(data, jwtSecretKey);
        res.cookie("token", token);
        res.redirect('/admin?flash=succesfully loggedIn');
      }
      else {
        res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });
      }
    })
  }
  else if (result[0] === null) {
    if (result[1].status != "accepted") {
      res.render("loginpag", { "loginCheckDet": "You are not Approved!", "colorOfSpan": true });
    }
    else {
      bcrypt.compare(req.body.login_password, result[1].companyPassword).then(function (resultOfPasswordComparison) {
        if (resultOfPasswordComparison) {
          let jwtSecretKey = process.env.JWT_SECRET_KEY;
          let data = {
            email:req.body.login_email ,
            auth:true,
            role: "company",
            companyName:result[1].companyName,
          }
  
          const token = jwt.sign(data, jwtSecretKey);
          res.cookie("token", token);
          res.redirect('/?flash=succesfully loggedIn');
        }
        else {
          res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });
        }
      })
    }
  }
  else if (result[1] === null) {

    bcrypt.compare(req.body.login_password, result[0].userPassword).then(function (resultOfPasswordComparison) {
      if (resultOfPasswordComparison) {

        let jwtSecretKey = process.env.JWT_SECRET_KEY;
        let data = {
          email:req.body.login_email ,
          auth:true,
          role: "user",
        }

        const token = jwt.sign(data, jwtSecretKey);
        res.cookie("token", token);
        res.redirect('/?flash=succesfully loggedIn');
      }
      else {
        res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });

      }

    })


  }


});




router.get('/logout', function (req, res) {
  res.clearCookie("token");
  res.redirect("/");
})

module.exports = router;