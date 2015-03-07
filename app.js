var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

//use mongoose
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/bill2");

// view engine setup
var views = [
    path.join(__dirname, 'user/views'),
    path.join(__dirname, 'bill/views')
];
app.set('views', views);
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'bower_components')));

//use express-session
var session = require('express-session');
app.use(session({secret: 'keyboard catt'}));

//use method-override
var methodOverride = require('method-override');
app.use(methodOverride('X-HTTP-Method'));          // Microsoft
app.use(methodOverride('X-HTTP-Method-Override')); // Google/GData
app.use(methodOverride('X-Method-Override'));      // IBM

//use module user
var user = require('./user');
app.use('/user/api/', user.apiRoute);
app.use('/user/', user.route);
app.use(express.static(path.join(__dirname, 'user/public')));

//use module bill
var bill = require('./bill');
app.use('/bill/', bill.route);
app.use(express.static(path.join(__dirname, 'bill/public')));

//index
app.get('/', bill.index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
