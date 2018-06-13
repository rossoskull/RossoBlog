var express = require('express');
var app = express();
var mongo = require('mongodb');
var db = require('monk')('localhost/rossoblog');
var bcrypt = require('bcrypt');
var session = require('express-session');
var octicons = require('octicons');

app.use(session({
	secret: 'abc1234',
	saveUinitialised: true,
	resave: true
}));

// Log In Page
app.get('/', function(req, res, next) {
	if ( req.session.admin ) redirect('/admins/dashboard');
	res.render('login', {title: 'Admins'});
});

// Check if request is authorized
app.get('*', function(req, res, next) {
	if ( !req.session.admin ) {
		console.log('Invalid Access...');
		req.flash('Error', 'Log In to continue.');
		res.redirect('/admins');
	}
	next();
});



// Handle Request
app.post('/login', function(req, res, next) {
	var params = req.body;
	req.check('uname', 'Enter a Username').notEmpty();
	req.check('pass', 'Enter a Password').notEmpty();

	var errors = req.validationErrors();

	if(errors) {
		res.render('login', {
			title: 'Admins',
			errors: errors,
			uname: params.uname,
			pass: params.pass,
			admin: req.session.admin
		})
	} else {
		var admins = db.get('admins');
		admins.findOne({uname: params.uname},{}, function(err, admin) {
			if ( err ) throw err;
			if ( admin ) {
				// If User with the username is found
				bcrypt.compare(params.pass, admin.pass, function(err, isMatch) {
					if(err) throw err;
					if( isMatch ) {
						req.session.admin = admin;
						res.redirect('/');
					} else {
						req.flash('Error', 'Password incorrect. Try again.');
						res.render('login', {
							title: 'Admins'
						});
					}
				})


			} else {
				req.flash('Error', 'Username incorrect. Try again.');
				res.render('login', {
					title: 'Admins'
				});
			}
		});
	}
});


// Check if authorised for post requests.
app.post('*', function(req, res, next) {
	if ( !req.session.admin ) {
		console.log('Invalid Access...');
		req.flash('Error', 'Log In to continue.');
		res.redirect('/admins');
	}
	next();
});


//Logout
app.get('/logout', function(req, res, next) {
	req.session.destroy(function(err) {
		if (err) throw err;
	});
	res.redirect('/admins');
});

//Dashboard
app.get('/dashboard', function(req, res, next) {

	var posts = db.get('posts');
	var admins = db.get('admins')

	posts.find({}, {fields : { _id: 1, title: 1, date: 1, author: 1 }}, function(err, posts) {
		if ( err ) throw err;
		admins.find({}, '-pass', function(err, admins) {
			if ( err ) throw err;
			res.render('dashboard', { title: 'Admin', posts: posts, admins: admins, oct: octicons, admin: req.session.admin});
		});
	});

});

app.get('/add', function(req, res, next) {
	if ( req.session.admin.class != 'admin') redirect('/admins/dashboard');

	res.render('addacc', {
		title: 'Add Account',
		admin: req.session.admin
	});
});

//Add Admin Account
app.post('/addadmin', function(req, res, next) {
	// Insert the data
	var params = req.body;
	req.check('fname', 'Enter a First Name').notEmpty();
	req.check('lname', 'Enter a Last Name').notEmpty();
	req.check('uname', 'Enter a Username').notEmpty();
	req.check('pass', 'Enter a Password').notEmpty();
	req.check('pass', 'Passwords do not match').equals(params.repass);

	// Get errors
	var errors = req.validationErrors();
	if( errors ) {
		res.render('addacc', {
			title: 'Add Account',
			errors: errors,
			fname: params.fname,
			lname: params.lname,
			uname: params.uname
		});
	} else {
		// Check if username is still in use
		var newAcc = db.get('admins');
		newAcc.findOne({uname: params.uname}, {}, function(err, newAcc) {
			if ( newAcc ) {
				// If it is in use
				req.flash('Error', 'Username already in use. Please use other username.');
				res.render('addacc', {
					title: 'Add Account',
					fname: params.fname,
					lname: params.lname,
					uname: params.uname
				});
			} else {
				// If not in use
				bcrypt.hash(params.pass, 10, function(err, hash) {
					if (err) throw err;
					newAcc = db.get('admins');
					newAcc.insert({
						fname: params.fname,
						lname: params.lname,
						uname: params.uname,
						pass: hash,
						class: params.class
					}, function(err) {
						if ( err ) {
							throw err;
						} else {
							req.flash('Success', 'Account created successfully.');
							res.redirect('/admins/dashboard');
						}
					});
				});

			}
		});
	}

});

// Remove User Account
app.get('/racc/:ID', function(req, res, next) {
	if ( req.session.admin.class != 'admin' ){
		req.flash('Error', 'You are not authorized for this action.');
		redirect('/admins/dashboard');
		next();
	 }
	var ID = req.params.ID;
	var acc = db.get('admins');
	acc.remove({_id: ID}, function(err) {
		if ( err ) throw err;
		req.flash('Success', 'Account deleted successfully.');
		res.redirect('/admins/dashboard');
	});
});

// Remove Post
app.get('/rpost/:ID', function(req, res, next) {
	var ID = req.params.ID;
	var post = db.get('posts');
	post.remove({_id: ID}, function(err) {
		if ( err ) throw err;
		req.flash('Success', 'Post deleted successfully.');
		res.redirect('/admins/dashboard');
	});
});

module.exports = app;
