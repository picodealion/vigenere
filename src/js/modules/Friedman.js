'use strict';

var utils = require('./utils.js'),

    log = utils.log;

module.exports = (function Friedman() {
    var settings = {
        IC: 0.067 // Index of Coincidence for English
    };

    return {
        confirmKeyLength: confirmKeyLength
    };

    function confirmKeyLength(cipher, lengths) {
        log('Friedman is my homeboy', true);
        $(document).trigger('FriedmanEnded', 8);
    }

}());