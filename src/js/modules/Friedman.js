'use strict';

var utils = require('./utils.js'),
    q     = require('q'),

    log = utils.log;

module.exports = (function Friedman() {
    var settings = {
        IC: 0.067 // Index of Coincidence for English
    };

    return {
        confirmKeyLength: confirmKeyLength
    };

    function confirmKeyLength(cipher, lengths) {
        var deferred = q.defer();

        log('Friedman is my homeboy', true);

        deferred.resolve(7);

        return deferred.promise;
    }

}());