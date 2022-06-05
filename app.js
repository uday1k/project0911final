require("dotenv").config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoUtil = require( './routes/mongoDB' );

const passport = require('passport');
const cookieSession = require('cookie-session');
require('./routes/passport');
var app = express();

app.set('trust proxy', 1);
app.use(cookieSession({
  name: 'cookie',
  keys: ['somerandomkey'],
  maxAge: 30 * 24 * 60 * 60 * 1000,
}));
app.use(passport.initialize());
app.use(passport.session());






app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));




mongoUtil.connectToServer( function( err) {
      if (err) console.log(err);

      app.use('/',require('./routes/index'));
      app.use('/admin',require('./routes/admin'));
      app.use('/admin/add',require('./routes/adminadd'));
      app.use('/company',require('./routes/company'));
      app.use('/user',require('./routes/users'));
            
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
    
} );





module.exports = {app:app};