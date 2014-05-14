var mongoose = require('mongoose'),
      slugin         = require('../');

var kittySchema = mongoose.Schema({ name: String });

kittySchema.plugin(slugin, {source: 'name'});

module.exports = mongoose.model('Kittens', kittySchema);