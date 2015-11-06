"use strict";

var
  mongoose = require('mongoose'),
  should   = require('chai').should(),
  _        = require('lodash'),
  Car      = require('./car'),
  Kitten   = require('./kitten'),
  Person   = require('./person');

var
  databaseConnection = process.env.SLUGIN_TEST || 'mongodb://localhost/slugin_test';

mongoose.connect(databaseConnection);

function setup(done) {
  Kitten.remove(function(e) {
    if (e) return done(e);
    Car.remove(function(e) {
      if (e) return done(e);
      Person.remove(done);
    });
  });
}

describe('Slugin', function() {

  describe('When saving a single kitten named Mittens', function() {

    before(setup);

    before(function(done) {
      var mittens = new Kitten({name : 'Mittens'});
      mittens.save(done);
    });

    it('Should save the kitten to the database with a slug based on the kitten name', function(done) {
        Kitten.findOne({slug_base : 'mittens'}, function(e,k) {
          should.not.exist(e);
          k.slug.should.eql('mittens');
          done();
        });
    });
  });

  describe('When saving two kittens named mittens in serial', function() {

    var kittens = null;

    before(setup);

    before(function(done) {
      new Kitten({name : 'Mittens'}).save(function(e) {
        if (e) return done(e);
        new Kitten({name : 'Mittens'}).save(done);
      });
    });

    before(function(done) {
      Kitten.find({name: 'Mittens'}, function(e,docs) {
        kittens = docs;
        done(e);
      });
    });

    it('should have two kittens in the collection', function() {
      kittens.should.have.length(2);
    });

    it('one kitten should have a slug of "mittens"', function() {
      _.where(kittens, {slug: 'mittens'}).should.have.length(1);
    });

    it('one kitten should have a slug of "mittens-{num}"', function() {
      _.filter(kittens, function(k) { return (/mittens-\d+/).test(k.slug);});
    });

  });

  describe('When you have a kitten named "Mittens"', function() {

    before(setup);

    before(function(done) {
      new Kitten({ name : 'Mittens'}).save(done);
    });

    describe('and you want to rename him "Boots"', function() {
      var kitten = null;

      before(function(done) {
        Kitten.findOne({name: 'Mittens'}, function(e,k) {
          if (e) return done(e);
          k.name = 'Boots';
          k.save(function(e,boots) {
            if (e) return done(e);
            kitten = boots;
            done();
          });
        });
      });

      it('should have its slug set to "boots"', function() {
        kitten.slug.should.eql('boots');
        kitten.slug_base.should.eql('boots');
        kitten.should.not.have.ownProperty('slug_it');
      });
    });
  });

  describe('When indexing cars with the same model name', function() {

    var cars = null;

    before(function(done) {
      new Car({make: 'Toyota', model: 'Highlander'}).save(function(e) {
        if (e) return done(e);
        new Car({make: 'Toyota', model: 'Highlander'}).save(function(e) {
          if (e) return done(e);
          new Car({make: 'Scottish', model: 'Highlander'}).save(done);
        });
      });
    });

    before(function(done) {
      Car.find({}, function(e,docs) {
        if (e) return done(e);
        cars = docs;
        done();
      });
    });

    describe('from the same manufacturer', function() {
      it('should still uniquely slugify', function() {
        var slugs = _.pluck(cars, 'slug');
        slugs.length.should.eql(cars.length);
      });
    });

    describe('from different manufacturers', function() {
      it('should allow the same model name for each without bumping the iterator', function() {
        var scot = _.find(cars, {make:'Scottish'});
        scot.slug.should.eql('scottish-highlander');
      });
    });
  });

  describe('When saving a single person with a deep path slug source', function() {

    before(function(done) {
      var someGuy = new Person({
        name : {
          first: 'Some',
          last: 'Guy'
        }
      });
      someGuy.save(done);
    });

    it('Should save the person to the database with a slug based on the name object paths', function(done) {
      Person.findOne({slug_base : 'some-guy'}, function(e,k) {
        should.not.exist(e);
        k.slug.should.eql('some-guy');
        done();
      });
    });
  });

});
