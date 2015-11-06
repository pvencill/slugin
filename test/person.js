var mongoose = require('mongoose')
var slugin         = require('../');

var personSchema = mongoose.Schema(
	{ 
		name: {
			first: String,
			last: String
		}
	});

personSchema.plugin(slugin, {source: ['name.first', 'name.last']});

module.exports = mongoose.model('Person', personSchema);