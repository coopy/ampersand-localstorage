'use strict';
/**
 * Ampersand JS localStorage mixin
 * https://github.com/per-nilsson/ampersand-localstorage
 * Version 0.0.1
 *
 * Adapted from Backbone.localStorage by @jeromegn:
 * https://github.com/jeromegn/Backbone.localStorage
 *
 * Usage:
 * ```
 *     var AmpersandLocalstorage = require('ampersand-localstorage');
 *     var Model = require('ampersand-model').extend({
 *         props: {
 *             someProperty: 'string'
 *         }
 *     });
 *
 *     // Replaces `Model.prototype.sync` with `AmpersandLocalstorage.localSync`.
 *     // Adds a `storage` object with internals.
 *     // Model objects will be stored under keys prefixed by "myModelName".
 *     AmpersandLocalstorage.patch(Model, "myModelName");
 *
 *     var model = new Model({ someProperty: 'someValue' });
 *
 *     // Will save model to localStorage, setting `idAttribute` to a pseudo-GUID.
 *     model.save();
 *     // Will retrieve model from localStorage.
 *     model.fetch();
 * ```
 */

// Generate four random hex digits.
var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
var guid = function() {
     return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

var isObject = function(item) {
    return item === Object(item);
};

var contains = function(array, item) {
    var i = array.length;
    while (i--) if (array[i] === item) return true;
    return false;
};

var extend = function(obj, props) {
    for (var key in props) obj[key] = props[key]
    return obj;
};

var LocalStorage = function(name) {
    if( !window.localStorage ) {
        throw "Ampersand-LocalStorage: Environment does not support localStorage."
    }
    this.name = name;
    this.serializer = {
        serialize: function(item) {
            return isObject(item) ? JSON.stringify(item) : item;
        },
        // fix for "illegal access" error on Android when JSON.parse is passed null
        deserialize: function (data) {
            return data && JSON.parse(data);
        }
    };
    var store = this.localStorage().getItem(this.name);
    this.records = (store && store.split(",")) || [];
};

extend(LocalStorage.prototype, {

    // Save the current state of the **Store** to *localStorage*.
    save: function() {
        this.localStorage().setItem(this.name, this.records.join(","));
    },

    // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
    // have an id of it's own.
    create: function(model) {
        if (!model.getId()) {
            model[model.idAttribute] = guid();
        }
        this.localStorage().setItem(this._itemName(model.getId()), this.serializer.serialize(model));
        this.records.push(model.getId().toString());
        this.save();
        return this.find(model) !== false;
    },

    // Update a model by replacing its copy in `this.data`.
    update: function(model) {
        this.localStorage().setItem(this._itemName(model.getId()), this.serializer.serialize(model));
        var modelId = model.getId().toString();
        if (!contains(this.records, modelId)) {
            this.records.push(modelId);
            this.save();
        }
        return this.find(model) !== false;
    },

    // Retrieve a model from `this.data` by id.
    find: function(model) {
    	var found = this.localStorage().getItem(this._itemName(model.getId()))
    	return this.serializer.deserialize(found);
    },

    // Return the array of all models currently in storage.
    findAll: function() {
        var result = [];
        for (var i = 0, id, data; i < this.records.length; i++) {
            id = this.records[i];
            data = this.serializer.deserialize(this.localStorage().getItem(this._itemName(id)));
            if (data != null) result.push(data);
        }
        return result;
    },

    // Delete a model from `this.data`, returning it.
    destroy: function(model) {
        this.localStorage().removeItem(this._itemName(model.getId()));
        var modelId = model.getId().toString();
        for (var i = 0, id; i < this.records.length; i++) {
            if (this.records[i] === modelId) {
                this.records.splice(i, 1);
            }
        }
        this.save();
        return model;
    },

    localStorage: function() {
        return window.localStorage;
    },

    // Clear localStorage for specific collection.
    _clear: function() {
        var local = this.localStorage(),
            itemRe = new RegExp("^" + this.name + "-");

        // Remove id-tracking item (e.g., "foo").
        local.removeItem(this.name);

        // Match all data items (e.g., "foo-ID") and remove.
        for (var k in local) {
            if (itemRe.test(k)) {
                local.removeItem(k);
            }
        }

        this.records.length = 0;
    },

    // Size of localStorage.
    _storageSize: function() {
        return this.localStorage().length;
    },

    _itemName: function(id) {
        return this.name+"-"+id;
    }

});

var localSync = function(method, model, options) {
    var store = model.localStorage || model.collection.localStorage;
    var resp;
    var errorMessage;

    try {

        switch (method) {
            case "read":
                resp = model.getId() != undefined ? store.find(model) : store.findAll();
                break;
            case "create":
                resp = store.create(model);
                break;
            case "update":
                resp = store.update(model);
                break;
            case "delete":
                resp = store.destroy(model);
                break;
        }

    } catch(error) {
        if (error.code === 22 && store._storageSize() === 0) {
            errorMessage = "Private browsing is unsupported";
        }
        else {
            errorMessage = error.message;
        }
    }

    if (resp && options && options.success) {
        options.success(resp);
    } else if (options && options.error) {
        errorMessage = errorMessage || "Record Not Found";
        options.error(errorMessage);
    }

    // add compatibility with $.ajax
    // always execute callback for success and error
    if (options && options.complete) options.complete(resp);

    // TODO What to return?
    return;
};

module.exports = {
    patch: function (Model, name) {
        Model.prototype.localStorage = new LocalStorage(name);
        Model.prototype.sync = localSync;
    }
}
