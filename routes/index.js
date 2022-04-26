const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
var qs = require('querystring');


var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();





router.get('/', paginatedMacthedResults(), function (req, res) {
  res.locals.auth = req.session.auth;
  res.locals.role = req.session.role;
  res.locals.flashesValues = req.flash('checkFlash');

  let indexValues = {}

  indexValues.next = res.paginatedResults.next;
  indexValues.previous = res.paginatedResults.previous;
  indexValues.pageNo = res.paginatedResults.pageNo;

  if(res.paginatedResults.next)
  indexValues.nextURL="/?search_value="+req.query.search_value+"&page="+res.paginatedResults.next.page;
  if(res.paginatedResults.previous)
  indexValues.prevURL="/?search_value="+req.query.search_value+"&page="+res.paginatedResults.previous.page;
    if(req.query.search_value==="undefined")
    indexValues.search_id_value=undefined;
    else
      indexValues.search_id_value=req.query.search_value;

  indexValues.rorj = res.paginatedResults.results;
  res.render("index", indexValues);

})

router.get('/courses', function (req, res) {
  res.locals.auth = req.session.auth;
  res.locals.role = req.session.role;
  res.render("courses");
})


function paginatedMacthedResults() {

  return (req, res, next) => {
    
    
    let skillsearch=req.query.search_value;
    if((!(skillsearch)) || skillsearch==="undefined"){
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
    else{
      skillsearch=skillsearch.replaceAll(","," ")
      let model=[];
      async function asRetriveSearch(){
        const aggCursor=dbo.collection("jobsDetails").aggregate([{ $match: { $text:{$search:skillsearch}}},{ $sort: { score: { $meta: "textScore" }}}])
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

router.get('/getsearch', paginatedMacthedResults(),async function (req, res) {
  let search_value=req.query.search_value;
  console.log(search_value)
  res.json(res.paginatedResults)
})


router.post('/gethints',async function (req, res) {
  let hintValues=[]
  let skills= dbo.collection("skillsTypes").find({ skillName: { $regex: req.body[0], $options: "i" } }).toArray();
  let  companies=dbo.collection("Companies").find({ companyName: { $regex: req.body[0], $options: "i" } }).toArray();

  let hints=await Promise.all([skills,companies])

  await Promise.all([
  hints[0].forEach(o => {hintValues.push(o.skillName);}),
  hints[1].forEach(o => {hintValues.push(o.companyName);})
  ])
   res.send(hintValues);
  
})


router.get('/login', function (req, res) {
  req.session.auth = false;
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
    //bcrypt.compare(req.body.login_password, result[2].adminPassword).then(function(resultOfPasswordComparison) {
    if (result[2].adminPassword === login_password_value) {
      res.locals.auth = req.session.auth = true;
      res.locals.role = req.session.role = "admin";
      req.flash('checkFlash', 'succesfully loggedIn');
      res.send("formSubmitted")
    }
    else {
      res.send("incorrectPassword")
    }
    //})
  }
  else if (result[0] === null) {
    if (result[1].status != "accepted") {
      res.send("notApproved")
    }
    else {
      bcrypt.compare(login_password_value, result[1].companyPassword).then(function (resultOfPasswordComparison) {
        if (resultOfPasswordComparison) {
          res.locals.auth = req.session.auth = true;
          res.locals.role = req.session.role = "company";
          res.locals.companyName = req.session.companyName = result[1].companyName;
          req.flash('checkFlash', 'succesfully loggedIn');
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
        res.locals.auth = req.session.auth = true;
        res.locals.role = req.session.role = "user";
        req.flash('checkFlash', 'succesfully loggedIn');
        res.send("formSubmitted")
      }
      else {
        res.send("incorrectPassword")
      }

    })


  }
  else {

  }



});

router.post('/validatelogin', async function (req, res) {


  const userData = dbo.collection("Users").findOne({ userEmail: req.body.login_email })
  const companyData = dbo.collection("Companies").findOne({ companyEmail: req.body.login_email })
  const adminData =dbo.collection("Admins").findOne({ adminEmail: req.body.login_email })
  

  
    let result = await Promise.all([userData, companyData, adminData])


    if (result[0] === null && result[1] == null && result[2] == null) {
      res.render("loginpag", { "loginCheckDet": "Email ID Not Found", "colorOfSpan": true });
    }
    else if (result[2] != null) {
      //bcrypt.compare(req.body.login_password, result[2].adminPassword).then(function(resultOfPasswordComparison) {
      if (result[2].adminPassword === req.body.login_password) {
        res.locals.auth = req.session.auth = true;
        res.locals.role = req.session.role = "admin";
        req.flash('checkFlash', 'succesfully loggedIn');
        res.redirect('/admin');
      }
      else {
        res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });
      }
      //})
    }
    else if (result[0] === null) {
      if (result[1].status != "accepted") {
        res.render("loginpag", { "loginCheckDet": "You are not Approved!", "colorOfSpan": true });
      }
      else {
        bcrypt.compare(req.body.login_password, result[1].companyPassword).then(function (resultOfPasswordComparison) {
          if (resultOfPasswordComparison) {
            res.locals.auth = req.session.auth = true;
            res.locals.role = req.session.role = "company";
            res.locals.companyName = req.session.companyName = result[1].companyName;
            req.flash('checkFlash', 'succesfully loggedIn');
            res.redirect('/');
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
          res.locals.auth = req.session.auth = true;
          res.locals.role = req.session.role = "user";
          req.flash('checkFlash', 'succesfully loggedIn');
          res.redirect('/');
        }
        else {
          res.render("loginpag", { "loginCheckDet": "Incorrect Password", "colorOfSpan": true });

        }

      })


    }
    else {

    }
  

});




router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect("/");
})


module.exports = router;
