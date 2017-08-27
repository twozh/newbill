var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../../user').User;

var billSchema = new Schema({
	user	: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	category: {type: String, required: true},
	spend	: {type: Number, required: true},
	dscr	: {type: String},
	date   	: {type: Date, default: Date.now, required: true},
	image	: [String],
	member	: {type: String},
});

billSchema.statics.getBillsByUseridAndMonth = function(userid, date, cb){
	var startDate = date;
	startDate.setDate(1);
	startDate.setHours(0,0,0,0);
	var endDate = new Date(startDate);
	endDate.setMonth(endDate.getMonth() + 1);

	Bill.find({user: userid})
	.where('date').gte(startDate).lte(endDate)
	.sort('-date')
	.exec(function(err, bills){
		if (err){
			return cb(err);
		}
		cb(null, bills);
	});
};

billSchema.statics.getBillsByUseridAndYear = function(userid, date, cb){
	var startDate = date;
	startDate.setMonth(0);
	startDate.setDate(1);
	startDate.setHours(0,0,0,0);
	var endDate = new Date(startDate);
	endDate.setMonth(11);
	endDate.setDate(31);
	endDate.setHours(23,59,59,999);

	Bill.find({user: userid})
	.where('date').gte(startDate).lte(endDate)
	.sort('-date')
	.exec(function(err, bills){
		if (err){
			return cb(err);
		}
		cb(null, bills);
	});
};


var Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;

