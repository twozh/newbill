var express = require('express');
var router = express.Router();
var User = require('../models/User.js');
var Bill = require('../models/Bill.js');
var Goal = require('../models/MonthGoal.js');

/* GET home page. */
var index = function(req, res){
	res.render('index');
};

var login = function(req, res) {	
	res.render('template/login');
};

var loginPost = function(req,res){
	console.log(req.body);
	User.auth(req.body.name, req.body.pass, function(err, userid){
		if (err){
			return res.send({status: "err", msg: err.message});
		}

		req.session.regenerate(function(){
			req.session.userid = userid;
			req.session.username = req.body.name;
			req.session.auth = true;
			return res.send({status: "succ", msg: "Login OK! Welcom!"});
	    });
	});
};

var signup = function(req, res) {
	res.render('template/signup');
};

var signupPost = function(req, res){
	console.log(req.body);
	User.create(req.body, function(err, msg){
		if (err){
			return res.send({status: 'err', msg: err.message});
		}
		res.send(msg);
	});
};

var bill = function(req, res){	
	if (req.session.auth !== true || req.session.username !== req.params.user){
		return res.redirect('/login');
	}

	var render = {};
	render.user = req.params.user;
	render.monthTotal = 0;

	res.render('template/bill', render);
};

var apiRetrieveBills = function(req, res){
	var d;
	if (req.query.date){
		d = new Date(req.query.date);
	} else{
		d = new Date();
	}
	Bill.getBillsByUseridAndMonth(req.session.userid, d, function(err, bills){
		if (err){
			bills = [];
		} 

		res.send(bills);
	});
};

var apiCreateBill = function(req, res){
	req.body.user = req.session.userid;

	var bill = new Bill(req.body);
	bill.save(function(err, b){
		if (err){
			console.log(err);
			return res.status(403).send(err.message);
		}
		res.send(b);
	});
};

var apiDeleteBill = function(req, res){	
	Bill.findByIdAndRemove(req.params.id, function(err, bill){
		if (err){
			console.log(err);
			return res.status(403).send(err.message);
		}

		res.send(bill);
	});	
};

var apiUpdateBill = function(req, res){
	//can't update _id
	if (req.body._id){
		delete req.body._id;
	}

	Bill.findByIdAndUpdate(req.params.id, req.body, function(err, bill){
		if (err){
			console.log(err);
			return res.status(403).send(err.message);
		}

		res.send(bill);
	});
};

var verifySession = function(req, res, next){
	if (req.session.auth !== true){
		return res.status(403).send("not-login");
	}

	next();
};

var apiRetrieveGoal = function(req, res){
	var obj = {
		user: req.session.userid,
		month: req.query.month,
		year: req.query.year,
	}
	console.log(obj);

	Goal.findOne(obj, function(err, goal){
		if (err){
			console.log(err);
			return res.status(403).send('sys-error');
		}

		console.log(goal);

		if (goal === null){
			//not exist, create new one
			var g = new Goal(obj);
			g.save(function(err, newGoal){
				if (err){
					console.log(err);
					return res.status(403).send(err.message);
				}
				console.log(newGoal);
				res.send(newGoal);
			});
		} else{
			console.log(goal);
			res.send(goal);			
		}
	});
};

var apiUpdateGoal = function(req, res){
	Goal.findByIdAndUpdate(req.params.id, req.body, function(err, g){
		if (err){
			console.log(err);
			return res.status(403).send(err.message);
		}

		res.send(g);
	});
};

//user register&log
router.get('/', 		index);
router.get('/login', 	login);
router.get('/signup', 	signup);
router.post('/signup', 	signupPost);
router.post('/login', 	loginPost);

//SAP-page
router.get('/:user', bill);

//CRUD-bill
router.post('/api/bills', 		verifySession, apiCreateBill);
router.get('/api/bills', 		verifySession, apiRetrieveBills);
router.put('/api/bills/:id', 	verifySession, apiUpdateBill);
router.patch('/api/bills/:id', 	verifySession, apiUpdateBill);
router.delete('/api/bills/:id', verifySession, apiDeleteBill);

//CRUD-month goal
router.get('/api/goal', 		verifySession, apiRetrieveGoal);
router.patch('/api/goal/:id', 	verifySession, apiUpdateGoal);


module.exports = router;
