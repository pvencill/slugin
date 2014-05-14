'use strict';

var mongoose = require('mongoose'),
      _                 = require('lodash'),
      pascal        = require('to-pascal-case'),
      slugs          = require('slugs');

function slugify(model, options){
    var slugParts = _.values(_.pick(model, options.source));
    if(options.suffix)
        slugParts.push(options.suffix);
    return slugs(slugParts.join(' '));
}

function createIndex(schema, options){
    var idx = {};
    if(_.isString(options.index)){
        idx[options.index] = 1;
    }else if (_.isArray(options.index)){
        idx = _.zipObject(options.index, _.range(1, options.index.length + 1, 0));
    }else if (_.isObject(options.index)){
        idx = options.index;
    } else {
        throw new Error('Index option improperly formatted, please see Slugin documentation');
    }

    schema.index(idx, {unique : true, sparse: true});
}

function getModel(document, options){
    var modelName = pascal(options.modelName || document.collection.name);
    return document.model(modelName);
}

function incrementAndSave(document, options, cb){
    var Model = getModel(document, options);
    var params = {};
    var slugbaseKey = options.slugName + '_base';
    var itKey = options.slugName + '_it';
    params[slugbaseKey] = document[slugbaseKey];

    Model.findOne(params).sort('-'+itKey).exec(function(e, doc){
        if(e) return cb(e);

        var it = (doc[itKey] || 0) + Math.ceil(Math.random()*10);

        document[itKey] = it;
        document[options.slugName] = document[slugbaseKey]+'-'+it;

        return document.save(cb);
    });
}

function Slugin(schema, options){
    options = _.defaults(options || {}, Slugin.defaultOptions);
    options.index = options.index || options.slugName;

    var fields = {};
    fields[options.slugName] = {
        type : String
    };

    fields[options.slugName + '_base'] = {
        type: String,
        index:true
    };

    fields[options.slugName + '_it'] = {
        type: Number
    };

    schema.add(fields);

    createIndex(schema, options);

    schema.pre('save', function(next){
        if(!this[options.slugName]){  // TODO: handle changes to the source
            this[options.slugName] = slugify(this, options);
            this[options.slugName + '_base'] = this[options.slugName];
        }
        next();
    });

    schema.methods.save = function(cb){
        var self = this;
        mongoose.Model.prototype.save.call(self, function(e, model, num){
            if(e && e.code === 11000 && !!~e.err.indexOf(self.slug)){
                incrementAndSave(self, options, cb);
            }else{
                cb(e,model,num);
            }
        });
    };
}

Slugin.defaultOptions = {
    slugName : 'slug',
    source : 'title',
    index : null
};

module.exports = Slugin;