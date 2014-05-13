var mongoose = require('mongoose'),
      slugin         = require('../'),
      pascal         = require('to-pascal-case');

mongoose.connect('mongodb://localhost:27017/spike');

var kittySchema = mongoose.Schema({ name: String });

// kittySchema.pre('save', function(next){
//     console.log(pascal(this.collection.name));
//     next();
// });

kittySchema.plugin(slugin, {source: 'name'});

module.exports = mongoose.model('Kittens', kittySchema);