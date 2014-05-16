var mongoose = require('mongoose'),
      slugin         = require('../');

var carSchema = mongoose.Schema({ make : String, model: String });

carSchema.plugin(slugin, {source: ['make', 'model']});

module.exports = mongoose.model('Car', carSchema);