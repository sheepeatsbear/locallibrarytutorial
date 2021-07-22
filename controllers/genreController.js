var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require("async");

const { body, validationResult } = require("express-validator");


// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
        .sort([["genre", "ascending"]])
        .exec(function(err, list_genres) {
            if (err) { return next(err); }
            res.render("genre_list", { title: "Genre List", genre_list: list_genres });
        });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ "genre": req.params.id })
                .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre === null) {
            var err = new Error("Genre not found");
            err.status = 404;
            return next(err);
        }
        res.render("genre_detail", { title: "Genre Detail", genre: results.genre, genre_books: results.genre_books })
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

    (req, res, next) => {

        const errors = validationResult(req);

        var genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            res.render("genre_form", { title: "Create Genre", genre: genre, errors: errors.array() });
            return;
        }
        else {
            Genre.findOne({ "name": req.body.name })
                .exec(function(err, found_genre) {
                    if (err) { return next(err); }

                    if (found_genre) {
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(function(err) {
                            if (err) { return next(err); }
                            res.redirect(genre.url);
                        })
                    }
                })
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {

    async.parallel({

        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({ "genre": req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err) }


        res.render("genre_delete", { title: "Delete Genre", genre: results.genre, genre_books: results.genre_books })


    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {

    async.parallel({

        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({ "genre": req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err) }

        if (results.genre_books.length > 0) {
            res.render("genre_delete", { title: "Delete Genre", genre: results.genre, genre_books: results.genre_books })
        } else {

            Genre.findByIdAndRemove(req.params.id, function deleteGenre(err) {
                if (err) { return next(err) }
                res.redirect("/catalog/genres")
            })
        }

    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre === null) {
            var err = new Error("Genre not found");
            err.status = 404;
            return next(err);
        }
        res.render("genre_form", { title: "Update Genre", genre: results.genre })
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate and sanitise fields.

    body('name', 'Genre must contain at least 3 characters').trim().isLength({ min: 3 }).escape(),


    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        var genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id //This is required, or a new ID will be assigned!
            });

        if (!errors.isEmpty()) {


            // There are errors. Render form again with sanitized values/error messages.

            res.render("genre_form", {
                title: "Update Genre", genre: genre, errors: errors.array()
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, genre) {
                console.log("test3");
                if (err) { return next(err); }
                // Successful - redirect to book detail page.
                res.redirect(genre.url);
            });
        }
    }
];

