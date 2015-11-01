'use strict';

var _     = require('lodash'),
    utils = require('./utils.js'),

    log = utils.log;

module.exports = (function Friedman() {
    var settings = {
            IC: 0.067 // Index of Coincidence for English
        },
        cipherText;

    return {
        confirmKeyLength: confirmKeyLength
    };

    /**
     * @private
     *
     * @param {Array} lengths An array of possible key lengths for the cipher
     * @returns {Array} ICs an array of arrays, each a keylength-IC pair
     */
    function calculateICForEachKeylength(lengths) {
        var ICs = [];

        _.forEach(lengths, function(length) {
            var IC = getICForKeyLength(length);

            log('IC for key with length ' + length + ': ' + IC, true);

            ICs.push([length, IC]);
        });

        return ICs;
    }

    function confirmKeyLength(cipher, lengths) {
        var bestGuess,
            ICs;

        log('Checking most probable key length', true);
        log('Index of Coincidence for English: ' + settings.IC, true);

        cipherText = cipher;

        ICs = calculateICForEachKeylength(lenghts);
        bestGuess = ICs[0][0]; //calculateBestGuessKeyLength(ICs);

        return bestGuess;
    }

    /**
     * @private
     *
     * @param {Array} columns The cipher text split up in to columns
     * @returns  {Number} the "delta bar IC" (combined IC of all columns)
     */
    function getDeltaBarIC(columns) {
        return 3
    }

    /**
     * @private
     *
     * @param {Number} length Key length to check the IC for
     * @returns  {Number} the IC for the specified keylength
     */
    function getICForKeyLength(length) {
        var columns = splitTextIntoColumns(length);
        return getDeltaBarIC(columns);
    }

    /**
     * @private
     *
     * @param {Number} amount Amount of columns to split the text in
     * @returns {Array} columns An array of strings, each consisting of every
     * nth letter in the cipher (where n ranges from 1 to the specified amount)
     */
    function splitTextIntoColumns(amount) {
        var columns = [];

        for (var i= 0; i < amount; i++) {
            var column = utils.getEveryNthChar(string, amount, i);
            columns.push(column);
        }

        return columns;
    }


}());