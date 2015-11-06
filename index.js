'use strict';

var
	mongoose   = require('mongoose'),
  _          = require('lodash'),
  inflection = require('inflection'),
  slugs      = require('slugs');

function slugify(model, options) {
  var slugParts = _.map(options.source, function(path) {
    return _.get(model, path);
  });
  return slugs(slugParts.join(' '));
}

function getModel(document, options) {
	var modelName = options.modelName || inflection.singularize(inflection.camelize(document.collection.name));
	return document.collection.conn.model(modelName);
}

function incrementAndSave(document, options, cb) {
  var Model = getModel(document, options);
  var params = {};
  var slugbaseKey = options.slugBase;
  var itKey = options.slugIt;
  params[slugbaseKey] = document[slugbaseKey];

  Model.findOne(params).sort('-'+itKey).exec(function(e, doc) {
    if(e) return cb(e);

    var it = (doc[itKey] || 0) + Math.ceil(Math.random()*10);

    document[itKey] = it;
    document[options.slugName] = document[slugbaseKey]+'-'+it;
    document.markModified(slugbaseKey);

    _.forEach(options.source, function(item) {
      document.markModified(item);
    });

    return document.save(cb);
  });
}

function Slugin(schema, options) {
  options = _.defaults(options || {}, Slugin.defaultOptions);
  if (_.isString(options.source)) options.source = [options.source];
  options.slugIt = options.slugName + '_it';
  options.slugBase = options.slugName + '_base';
  var fields = {};
  fields[options.slugName] = {
    type : String,
    unique: true
  };

  fields[options.slugBase] = {
    type: String,
    index:true
  };

  fields[options.slugIt] = {
    type: Number
  };

  schema.add(fields);

  schema.pre('save', function(next){
    var self = this;
    var slugBase = slugify(self, options);
    if (self[options.slugBase] !== slugBase) {
      self[options.slugName] = slugBase;
      self[options.slugBase] = slugBase;
      delete self[options.slugIt];
    }
    next();
  });

  schema.methods.save = function(cb){
    var self = this;
    mongoose.Model.prototype.save.call(self, function(e, model, num) {
      if (e && (e.code === 11000  || e.code === 11001) && !!~e.errmsg.indexOf(self[options.slugName])) {
        incrementAndSave(self, options, cb);
      } else {
        cb(e,model,num);
      }
    });
  };
}

Slugin.defaultOptions = {
  slugName  : 'slug',
  source    : 'title',
  modelName : null
};

module.exports = Slugin;
