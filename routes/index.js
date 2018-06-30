var express = require('express');
var app = express();
var mongo = require('mongodb');
var db = require('monk')('mongo db uri');
var bcrypt = require('bcrypt');

// Home Page
app.get('/', function(req, res, next) {
	// var db = req.db;
	var posts = db.get('posts');
	posts.find({}, {}, function(err, posts) {
		if (err) throw err;
		posts.reverse();
		var categories = db.get('categories');
		categories.find({}, {}, function(err, categories) {
			res.render('index', {title: 'Home', categories: categories, posts: posts, admin: req.session.admin});
		});
	});
});


module.exports = app;
