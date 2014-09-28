ampersand-localstorage
======================

Adaptation of [Backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage) for use with ampersand-model and ampersand-rest-collection.

Usage
-----

```js
    var AmpersandLocalstorage = require('ampersand-localstorage');
    var Model = require('ampersand-model').extend({
        props: {
            someProperty: 'string'
        }
    });

    // Replaces `Model.prototype.sync` with `AmpersandLocalstorage.localSync`.
    // Adds a `storage` object with internals.
    // Model objects will be stored under keys prefixed by "myModelName".
    AmpersandLocalstorage.patch(Model, "myModelName");

    var model = new Model({ someProperty: 'someValue' });

    // Will save model to localStorage, setting `idAttribute` to a pseudo-GUID.
    model.save();
    // Will retrieve model from localStorage.
    model.fetch();
```
