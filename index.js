'use strict';

var mongoose = require('mongoose'),
    _        = require('lodash'),
    slugs    = require('slugs');

function slugify(model, options){
    var slugParts = _.values(_.pick(model, options.source));
    if(options.suffix)
        slugParts.push(options.suffix);
    return slugs(slugParts.join(' '));
}

function Slugin(schema, options){
    options = _.defaults(options || {}, Slugin.defaultOptions);

    var field = {};
    field[options.slugName] = {
        type : String,
        index : true,
        unique : true
    }

    schema.add(field);

    schema.pre('save', function(next){
        if(!this.slug)
            this.slug = slugify(this, options);
        next();
    });

    schema.methods.save = function(cb){
        var self = this;
        self.count = self.count || 0;  // TODO: store this on the schema; might hold it between instances. use the slugName + _count as the key
        // Or maybe pull it from the db by keeping track of the base string and searching on 'like' strings. 

        mongoose.Model.prototype.save.call(self, function(e, model, num){
            if(e && e.code === 11000 && !~e.err.indexOf(self.slug)){
                self.slug = slugify(self, {suffix : self.count++});
                self.save(cb);
            }else{
                cb(e,model,num);
            }
        });
    }
}

Slugin.defaultOptions = {
    slugName : 'slug',
    source : 'title' 
};

module.exports = Slugin;