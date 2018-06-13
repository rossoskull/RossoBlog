var express = require('express');
var app = express();
var mongo = require('mongodb');
var db = require('monk')('localhost/rossoblog');
var bcrypt = require('bcrypt');

// Home Page
app.get('/', function(req, res, next) {
	// var db = req.db;
	var posts = db.get('posts');
	posts.find({}, {}, function(err, posts) {
		if (err) throw err;
		posts.reverse();
		res.render('index', {title: 'Home', posts: posts, admin: req.session.admin});
	});
});


module.exports = app;
