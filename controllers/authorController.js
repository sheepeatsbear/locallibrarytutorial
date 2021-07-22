var Author = require("../models/author");
var async = require('async');
var Book = require('../models/book');

const { body, validationResult } = require('express-validator');

exports.author_list = function(req, res) {
	Author.find()
		.sort([["family name", "ascending"]])
		.exec(function(err, list_authors) {
			if (err) { return next(err); }
			res.render("author_list", { title: "Author List", author_list: list_authors });
		});
};

exports.author_detail = function(req, res, next) {

	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id)
				.exec(callback)
		},
		authors_books: function(callback) {
			Book.find({ 'author': req.params.id }, 'title summary')
				.exec(callback)
		},
	}, function(err, results) {
		if (err) { return next(err); } // Error in API usage.
		if (results.author == null) { // No results.
			var err = new Error('Author not found');
			err.status = 404;
			return next(err);
		}
		// Successful, so render.
		res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books });
	});

};


exports.author_create_get = function(req, res, next) {
	res.render("author_form", { title: "Create Author" });
};

exports.author_create_post = [

	body("first_name").trim().isLength({ min: 1 }).escape().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
	body("family_name").trim().isLength({ min: 1 }).escape().withMessage("Family name must be specified.")
		.isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601().toDate(),
	body("date_of_death", "Invalid date of death").optional({ checkFalsy: true }).isISO8601().toDate(),

	(req, res, next) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			res.render("author_form", { title: "Create Author", author: req.body, errors: errors.array() })
			return;
		}
		else {
			var author = new Author(
				{
					first_name: req.body.first_name,
					family_name: req.body.family_name,
					date_of_birth: req.body.date_of_birth,
					date_of_death: req.body.date_of_death
				}
			);
			author.save(function(err) {
				if (err) { return next(err); }
				res.redirect(author.url);

			})
		}
	}
];

exports.author_delete_get = function(req, res) {

	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id).exec(callback)
		},
		authors_books: function(callback) {
			Book.find({ "author": req.params.id }).exec(callback)
		},
	}, function(err, results) {
		if (err) { return next(err); }
		if (results.author == null) {
			res.redirect("/catalog/authors");
		}
		res.render("author_delete", { title: "Delete Author", author: results.author, author_books: results.authors_books })
	})


};

exports.author_delete_post = function(req, res) {

	async.parallel({
		author: function(callback) {
			Author.findById(req.body.authorid).exec(callback)
		},
		authors_books: function(callback) {
			Book.find({ "author": req.body.authorid }).exec(callback)
		},
	}, function(err, results) {
		if (err) { return next(err) }

		if (results.authors_books.length > 0) {
			res.render("author_delete", { title: "Delete Author", author: results.author, author_books: results.authors_books })
			return;
		}
		else {

			Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
				if (err) { return next(err) }
				res.redirect("/catalog/authors")
			})
		}
	});
};

exports.author_update_get = function(req, res) {

	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id).exec(callback)
		},

	}, function(err, results) {
		if (err) { return next(err); }
		if (results.author == null) {
			res.redirect("/catalog/authors");
		}

		console.log(results.author)

		res.render("author_form", { title: "Update Author", author: results.author })
	})

};

exports.author_update_post = [

	// Validate and sanitise fields.
	body("first_name").trim().isLength({ min: 1 }).escape().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
	body("family_name").trim().isLength({ min: 1 }).escape().withMessage("Family name must be specified.")
		.isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601().toDate(),
	body("date_of_death", "Invalid date of death").optional({ checkFalsy: true }).isISO8601().toDate(),


	// Process request after validation and sanitization.
	(req, res, next) => {

		// Extract the validation errors from a request.
		const errors = validationResult(req);

		console.log(req);

		var author = new Author(
			{
				first_name: req.body.first_name,
				family_name: req.body.family_name,
				date_of_birth: req.body.date_of_birth,
				date_of_death: req.body.date_of_death,
				_id: req.params.id
			}
		);



		if (!errors.isEmpty()) {

			console.log(author);

			// There are errors. Render form again with sanitized values/error messages.
			res.render("author_form", {
				title: "Update Author", author: results.author, errors: errors.array()
			});
			return;
		}
		else {

			console.log(author);
			// Data from form is valid. Update the record.
			Author.findByIdAndUpdate(req.params.id, author, {}, function(err, author) {
				console.log("test3");
				if (err) { return next(err); }
				// Successful - redirect to book detail page.
				res.redirect(author.url);
			});
		}
	}
];