'use strict';

var _     = require('lodash'),
    utils = require('./utils.js'),

    log = utils.log;

module.exports = (function Friedman() {
    var cipherText,
        settings = {
            IC: 1.73, // Index of Coincidence for English
            letters: 26 // letters in target language alphabet
        };

    return {
        findBestKeyLength: findBestKeyLength
    };

    /**
     * @private
     *
     * @param {String} text Text to calculate the Index of Coincidence for
     * @returns {number} IC Index of Coincidence for the supplied text
     *
     * See https://en.wikipedia.org/wiki/Index_of_coincidence#Calculation
     */
    function calculateIC(text) {
        var letterCounts = utils.countLetters(text),
            IC,
            sum;

        sum = letterCounts.reduce(function(total, count) {
            return total + (count / text.length) * ((count - 1) / (text.length - 1))
        }, 0);

        // Normalize
        IC = settings.letters * sum;

        return IC;
    }

    /**
     * @private
     *
     * @param {Array} lengths An array of possible key lengths for the cipher
     * @returns {Array} ICs an array of arrays, each a keylength-IC pair
     */
    function calculateICForKeylengths(lengths) {
        var ICs = lengths.map(function(length) {
            var IC = getICForKeyLength(length);
            log('IC for key with length ' + length + ': ' + IC, true);

            return [length, IC];
        });

        return ICs;
    }

    /**
     * @public
     * 
     * @param {String} cipher The ciphertext to check the best matching key length for
     * @param {Array} lengths A list of possible key lengths (as defined using the Kasiski method?) 
     * @returns {Number} bestMatch The key length with the IC closest to the target language
     */
    function findBestKeyLength(cipher, lengths) {
        var bestMatch,
            ICs;

        log('Checking most probable key length', true);
        log('Index of Coincidence for English: ' + settings.IC, true);

        cipherText = cipher;

        ICs = calculateICForKeylengths(lengths);

        bestMatch = ICs[0][0]; //calculateBestGuessKeyLength(ICs);

        return bestMatch;
    }

    /**
     * @private
     *
     * @param {Array} columns The cipher text split up in to columns
     * @returns  {Number} the "delta bar IC" (combined IC of all columns)
     */
    function getDeltaBarIC(columns) {
        var deltaBarICs = columns.map(function(column) {
                var IC = calculateIC(column);
                console.log('getting IC for', column, IC);
                return IC;
            }).reduce(function(total, IC) {
                return total + IC;
            });

        return deltaBarICs / columns.length;
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
            var column = utils.getEveryNthChar(cipherText, amount, i);
            columns.push(column);
        }

        return columns;
    }


}());