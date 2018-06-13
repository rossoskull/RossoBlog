var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongo = require('mongodb');
var db = require('monk')('localhost/rossoblog');
var validator = require('express-validator');
var session = require('express-session');
var flash = require('connect-flash');
var upload = require('express-fileupload');
var moment = require('moment');


var indexRouter = require('./routes/index');
var adminsRouter = require('./routes/admins');
var postsRouter = require('./routes/posts');

var app = express();


app.get("*", function(req, res, next) {
	res.locals.moment = moment;
	next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Express Validator
app.use(validator({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.'),
      root = namespace.shift(),
      formParam = root;

    while (namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }

    return {
      param: formParam,
      msg: msg,
      value: value
    };
  }
}));

// Session
app.use(session({
  secret: 'abc123',
  saveUninitialised: true,
  resave: true
}));

// app.get('*', function(req, res, next) {
//   //res.locals.session = session;
// });

// Express-fileupload
app.use(upload());

// Express-Flash
app.use(flash());

// Express-Messages
app.use(function(req, res, next) {
	res.locals.messages = require('express-messages')(req, res);
	next();
});



app.use('/', indexRouter);
app.use('/admins', adminsRouter);
app.use('/posts', postsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
