var express = require("express");
var router = express.Router();

router.get('/', function(req, res, next){
	res.send("Your todos will be here");
});

module.exports = router;
