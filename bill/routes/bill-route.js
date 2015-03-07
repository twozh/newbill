var express = require('express');
var router = express.Router();
var Bill = require('./Bill.js');
var Goal = require('./MonthGoal.js');
var loginPath = require('../../user').loginPath;

//SAP
var index = function(req, res){
	//if not login, goto index
	if (req.session.auth !== true){
		return res.render('bill-index');
	}

	var render = {};
	render.user = req.session.username;
	render.monthTotal = 0;

	res.render('bill', render);
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
	};

	Goal.findOne(obj, function(err, goal){
		if (err){
			console.log(err);
			return res.status(403).send('sys-error');
		}

		if (goal === null){
			//not exist, create new one
			var g = new Goal(obj);
			g.save(function(err, newGoal){
				if (err){
					console.log(err);
					return res.status(403).send(err.message);
				}

				res.send(newGoal);
			});
		} else{
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

//CRUD-bill
router.post('/api/bills', 		verifySession, apiCreateBill);
router.get('/api/bills', 		verifySession, apiRetrieveBills);
router.put('/api/bills/:id', 	verifySession, apiUpdateBill);
router.patch('/api/bills/:id', 	verifySession, apiUpdateBill);
router.delete('/api/bills/:id', verifySession, apiDeleteBill);

//CRUD-month goal
router.get('/api/goal', 		verifySession, apiRetrieveGoal);
router.patch('/api/goal/:id', 	verifySession, apiUpdateGoal);

exports.route = router;
exports.index = index;