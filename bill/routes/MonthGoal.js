var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../../user').User;

var goalSchema = new Schema({
	user	: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	goal  	: {type: Number, required: true, default: 1000},
	month   : {type: Number, required: true, min: 0, max: 11},
	year    : {type: Number, required: true, min: 1700},
});

var Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;

