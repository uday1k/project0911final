var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const indexRouter=require('./routes/index');
const addsByAdmin=require('./routes/adminadd');
const company=require('./routes/company');
const adminRoutes=require('./routes/admin');
const userRoutes=require('./routes/users')
var flash = require('connect-flash');


const { render } = require('express/lib/response');

//for sending mails
var transporter = require('./routes/emailsent');
var x;

var app = express();
var session = require('express-session');
app.set('trust proxy', 1);



app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));


app.use(flash());



const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
//uuidv4();

var MongoDBStore = require('connect-mongodb-session')(session);
var store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/onlinejob',
  collection: 'mySessions'
});

// Catch errors
store.on('error', function (error) {
  console.log(error);
});



app.use(session({
  genid: function (req) {
    return uuidv4(); // use UUIDs for session IDs
  },
  secret: 'keyboard cat',
  store: store,
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 300000 }
}))




app.use('/',indexRouter);
app.use('/admin',adminRoutes);
app.use('/admin/add',addsByAdmin);
app.use('/company',company);
app.use('/user',userRoutes);






  var dbo;
  
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    dbo = db.db("onlinejob");
  });
  






app.post('/emailvalid', function (req, res) {
  console.log("x value is" + x);
  console.log("myobj1 value is" + myobj1);
  function insrtValidFunc() {
    const insertCred = new Promise(function (resolve, reject) {
      dbo.collection("credentials").insertOne(myobj1, function (err, res1) {
        if (err) {
          reject(err);
        }
        else {
          console.log("1 document inserted");
          resolve(res1);
        }


      });

    })
    return insertCred;
  }

  async function asEmailValidFunc() {
    if (x == req.body.otpcheck) {
      var res1CredInsert = insrtValidFunc();
      console.log(res1CredInsert);
      res.render("loginpag", { "loginCheckDet": "Successfully Registered! Please Login", "colorOfSpan": false });
    }
    else {
      res.render("emailcheck", { "checkOtp": "Invalid Otp" });
    }

  }
  asEmailValidFunc();


})















// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = {app:app};