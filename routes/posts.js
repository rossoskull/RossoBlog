var express = require('express');
var app = express();
var mongo = require('mongodb')
var db = require('monk')('localhost/rossoblog');
var markdown = require('markdown').markdown;
var bcrypt = require('bcrypt');
var moment = require('moment');


app.get('/', function(req, res, next) {
	if (!req.session.admin) {
		res.redirect('/');
	}

	var allCategories = db.get('categories');
	allCategories.find({}, {}, function(err, allCategories) {
		res.render('posts', { title:'Posts',categories: allCategories, admin: req.session.admin });
		});	
});

// Add posts
app.post('/add', function(req, res, next) {
	var title= req.body.title;
	var postbody = markdown.toHTML(req.body.postbody);
	var category = req.body.category;
	if ( category == 0 ) category = null;
	var date = new Date();

	// See if an image is uploaded, and save the file.
	if ( req.files.mainimage ) {
		var mimes = {
			'image/jpeg': '.jpg',
			'image/jpg': '.jpg',
			'image/png': '.png'
		}
		var mainimage = req.files.mainimage.name;
		mainimage = moment(new Date()).format("x") + mimes[req.files.mainimage.mimetype];
		console.log(mainimage);
		req.files.mainimage.mv('public/images/uploads/'+mainimage);

	} else {
		var mainimage = null;
	}

	req.check('title', 'You should enter a title.').notEmpty();
	req.check('postbody', 'You should body post.').notEmpty();
	//req.check('category', 'You should select a category.').equals(0);

	var errors = req.validationErrors();

	if ( errors ) {
		var allCategories = db.get('categories');
		allCategories.find({}, {}, function(err, allCategories) {
			console.log(errors);
			res.render('posts', {
				title: 'Posts',
				errors: errors,
				posttitle: title,
				body: req.body.postbody, 
				categories: allCategories,
				admin: req.session.admin
			});
		});
	} else {
		var posts = db.get('posts');
		posts.insert({
			title: title,
			author: req.session.admin.fname + ' ' + req.session.admin.lname,
			body: postbody,
			category: category,
			date: date,
			image: mainimage
		}, function(err, posts) {
			var allCategories = db.get('categories');
			allCategories.find({}, {}, function(err, allCategories) {
				if ( err ) {
					req.flash('Error','Unable to submit post. Please try later.');
					res.render('posts', {title: 'Posts', categories: allCategories, admin: req.session.admin });
				} else {
					req.flash('Success', 'Post added successfully!');
					res.render('posts', {title: 'Posts', categories: allCategories, admin: req.session.admin });
				}
			});
		});
	}

});


//Add Category
app.post('/addcategory', function(req, res, next) {
	var newcategory = req.body.category;
	var categories = db.get('categories');

	categories.find({category: newcategory}, {}, function(err, categories) {
		if ( err ) throw err;
		console.log(categories.length);
		if ( categories.length != 0 ) {
			var allCategories = db.get('categories');
			allCategories.find({}, {}, function(err, allCategories) {
	 			req.flash("Error", "Category already exists.");
	 			res.render('posts', {title:'Posts',categories: allCategories, admin: req.session.admin} );
	 		});	
		} else {
			categories = db.get('categories');
			categories.insert({category: newcategory}, function(err, categories) {
				if (err) throw err;
				var allCategories = db.get('categories');
				allCategories.find({}, {}, function(err, allCategories) {
					req.flash("Success", "New category added.");
					res.render('posts', {title:'Posts',categories: allCategories, admin: req.session.admin });
				});
			});
		}
	});

});

// View single post
app.get('/view/:ID', function(req, res, next) {
	var ID = req.params.ID;
	var post = db.get('posts');
	post.findOne({_id: ID}, {}, function(err, post) {
		if (err) throw err;
		if ( post ) {
			res.render('singlepost', {
				title: 'Posts',
				post: post
			})
		} else {
			res.send('Not found');
		}

	});
});

module.exports = app;