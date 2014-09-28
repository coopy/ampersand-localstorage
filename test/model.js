'use strict';

var test = require('tape');
var AmpersandLocalstorage = require('../ampersand-localstorage');
var AmpersandModel = require('ampersand-model');

var namespace = 'Model';
var localStorage = window.localStorage;
var testTimestamp = 1411925050700;

var testValues = {
    stringProp : 'stringValue',
    numberProp : 1,
    booleanProp: true
};

var testValues2 = {
    stringProp : '',
    numberProp : 0,
    booleanProp: false
};

var TestModel = AmpersandModel.extend({
    props: {
        stringProp:  'string',
        numberProp:  'number',
        booleanProp: 'boolean'
        //           [dataType, isRequired, defaultValue]
        // stringProp:  ['string', true, 'stringValue'],
        // numberProp:  ['number', true, 1],
        // booleanProp: ['boolean', true, true],
        // arrayProp:   ['array', true, ['a', 2, true]],
        // objectProp:  ['object', true, { nestedProp: true }],
        // dateProp:    ['date', true, new Date(testTimestamp)]
    }
});

// Replace #sync method and create storage object.
AmpersandLocalstorage.patch(TestModel, namespace);

// Convert model state to string
var toStr = function (model) {
  return JSON.stringify(model.toJSON());
}

// Get serialized model from localStorage
var getLocal = function (id) {
    return localStorage.getItem(namespace + '-' + id);
}

var reset = function () {
    localStorage.clear();
}

test('save', function (t) {
    reset();
    var model = new TestModel(testValues);
    model.save();

    t.equal(getLocal(model.getId()), toStr(model), 'model should persist to localStorage');
    t.end();
});

test('fetch', function (t) {
    reset();
    var model = new TestModel(testValues);
    model.save();
    var serialized = getLocal(model.getId());

    model.set(testValues2);
    model.fetch();

    t.equal(toStr(model), serialized, 'model should restore state from localStorage');
    t.end();
});

test('update', function (t) {
    reset();
    var model = new TestModel(testValues);
    model.save();
    model.set(testValues2);
    model.save();

    t.equal(getLocal(model.getId()), toStr(model), 'localstorage should have new model state');
    t.end();
});

test('destroy', function (t) {
    reset();
    var model = new TestModel(testValues);
    model.save();
    var id = model.getId();

    model.destroy();
    t.equal(getLocal(id), null);
    t.end();
});
