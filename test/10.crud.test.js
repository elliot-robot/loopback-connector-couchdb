'use strict';

var should = require('should');
var randexp = require('randexp').randexp;

var init = require('./init');

describe('CouchDB CRUD', function() {

  var ds;
  var connector;
  var Person;
  var persons;

  before(function(done) {
    init.getDataSource({
      database: randexp(/^[a-z]{16}$/),
      designDocs: {
        find: {
          views: {
            byName: {
              map: 'function(doc) { if (doc.name) emit(doc.name, null); }'
            }
          }
        }
      }
    }, function(err, res) {
      if (err) {
        return done(err);
      }
      ds = res;
      connector = ds.connector;
      Person = ds.createModel('person', {
        id: {
          type: String,
          id: true
        },
        name: String,
        age: Number
      });
      persons = [{
        id: '0',
        name: 'Charlie',
        age: 24
      }, {
        id: '1',
        name: 'Mary',
        age: 24
      }, {
        id: '2',
        name: 'David',
        age: 24
      }, {
        name: 'Jason',
        age: 44
      }];
      done();
    });
  });

  describe('Create', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    it('can create an instance with an id', function() {
      return Person.create(persons[0]).then(function(person) {
        person.id.should.equal('0');
        person.name.should.equal('Charlie');
      });
    });

    it('can create an instance without an id', function() {
      return Person.create(persons[3]).then(function(person) {
        person.id.should.be.String();
        person.name.should.equal('Jason');
      });
    });

    it('cannot create with a duplicate id ', function(done) {
      Person.create(persons[0]).then(function() {
        done(new Error('expected an error'));
      }, function(err) {
        should.exist(err);
        done();
      });
    });

    // TODO: more errors
  });

  describe('Find by ID', function() {
    var id3;

    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    before(function(done) {
      Person.create(persons[3]).then(function(person) {
        id3 = person.id;
        done();
      }, done);
    });

    it('can find a saved instance', function() {
      return Person.findById('0').then(function(person) {
        person.should.be.Object();
        person.id.should.equal('0');
        person.name.should.equal('Charlie');
        person.age.should.equal(24);
      });
    });

    it('can find a saved instance', function() {
      return Person.findById(id3).then(function(person) {
        person.should.be.Object();
        person.id.should.equal(id3);
        person.name.should.equal('Jason');
        person.age.should.equal(44);
      });
    });

    it('cannot find an unsaved instance', function() {
      return Person.findById('1').then(function(res) {
        should.not.exist(res);
      });
    });

    // TODO: more errors
  });

  describe('Destroy', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    it('can destroy a saved instance', function() {
      var person = Person(persons[0]);
      return person.remove().then(function(res) {
        res.should.be.Object().with.property('count', 1);
      });
    });

    it('cannot destroy an unsaved instance', function() {
      var person = Person(persons[2]);
      return person.remove().then(function(res) {
        res.should.be.Object().with.property('count', 0);
      });
    });

    // TODO: more errors
  });

  describe('Destroy by ID', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    it('can destroy a saved instance', function() {
      return Person.destroyById('0').then(function(res) {
        res.should.be.Object().with.property('count', 1);
      });
    });

    it('cannot destroy an unsaved instance', function() {
      return Person.destroyById('2').then(function(res) {
        res.should.be.Object().with.property('count', 0);
      });
    });

    // TODO: more errors
  });

  describe('Save', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    it('can update an instance', function() {
      return Person.findById('0').then(function(person) {
        person.name = 'Charlie II';
        return person.save().then(function(res) {
          res.should.be.Object();
          res.should.have.property('id', '0');
          res.should.have.property('name', 'Charlie II');
          res.should.have.property('age', 24);
        });
      });
    });

    it('can create an instance', function() {
      var person = Person(persons[1]);
      return person.save().then(function(res) {
        res.should.be.Object();
        res.should.have.property('id', '1');
        res.should.have.property('name', 'Mary');
        res.should.have.property('age', 24);
      });
    });

    // TODO: more errors
  });

  describe('Replace by ID', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    it('can replace a saved instance', function() {
      return Person.replaceById('0', {
        name: 'Charlie II',
        age: 25
      }).then(function(res) {
        res.should.be.Object();
        res.should.have.property('id', '0');
        res.should.have.property('name', 'Charlie II');
        res.should.have.property('age', 25);
      });
    });

    it('can replace a saved instance', function() {
      return Person.replaceById('0', {
        name: 'Charlie III'
      }).then(function(res) {
        res.should.be.Object();
        res.should.have.property('id', '0');
        res.should.have.property('name', 'Charlie III');
        res.should.have.property('age', undefined);
      });
    });

    it('cannot replace an unsaved instance', function(done) {
      Person.replaceById('lorem', {
        name: 'Charlie II',
        age: 25
      }).then(function() {
        done(new Error('expected an error'));
      }, function(err) {
        should.exist(err);
        done();
      });
    });

    // TODO: more errors
  });

  describe('Replace or create', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    it('can replace an instance', function() {
      return Person.replaceOrCreate({
        id: '0',
        name: 'Charlie II',
        age: 25
      }).then(function(res) {
        res.should.be.Object();
        res.should.have.property('id', '0');
        res.should.have.property('name', 'Charlie II');
        res.should.have.property('age', 25);
      });
    });

    it('can replace an instance', function() {
      return Person.replaceOrCreate({
        id: '0',
        name: 'Charlie III'
      }).then(function(res) {
        res.should.be.Object();
        res.should.have.property('id', '0');
        res.should.have.property('name', 'Charlie III');
        res.should.have.property('age', undefined);
      });
    });

    it('can create an instance', function() {
      return Person.replaceOrCreate(persons[1]).then(function(res) {
        res.should.be.Object();
        res.should.have.property('id', '1');
        res.should.have.property('name', 'Mary');
        res.should.have.property('age', 24);
      });
    });

    // TODO: more errors
  });

  describe('Find multiple', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function(done) {
      ds.autoupdate(done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    before(function() {
      return Person.create(persons[1]);
    });

    before(function() {
      return Person.create(persons[2]);
    });

    it('can find 2 instances', function() {
      return Person.findByIds(['0', '1']).then(function(res) {
        res.should.be.Array().with.length(2);
      });
    });

    it('cannot find wrong instances', function() {
      return Person.findByIds(['0', 'lorem']).then(function(res) {
        res.should.be.Array().with.length(1);
      });
    });

    it('can find 2 instances', function() {
      return Person.find({
        where: {
          id: {
            inq: ['0', '1']
          }
        }
      }).then(function(res) {
        res.should.be.Array().with.length(2);
      });
    });

    it('cannot find wrong instances', function() {
      return Person.find({
        where: {
          id: {
            inq: ['0', 'lorem']
          }
        }
      }).then(function(res) {
        res.should.be.Array().with.length(1);
      });
    });

    it('can find all instances', function() {
      return Person.find().then(function(res) {
        res.should.be.Array().with.length(3);
      });
    });

  });

  describe('Destroy multiple', function() {
    before(function(done) {
      connector._db.call('create', connector.settings.database, done);
    });

    after(function(done) {
      connector._db.call('destroy', connector.settings.database, done);
    });

    before(function() {
      return Person.create(persons[0]);
    });

    before(function() {
      return Person.create(persons[1]);
    });

    it('can remove 2 instances', function() {
      return Person.remove({
        id: {
          inq: ['0', '1']
        }
      }).then(function(res) {
        res.should.deepEqual({
          count: 2
        });
      });
    });

    it('cannot remove them again', function() {
      return Person.remove({
        id: {
          inq: ['0', '1']
        }
      }).then(function(res) {
        res.should.deepEqual({
          count: 0
        });
      });
    });
  });

});
