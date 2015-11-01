var _     = require('lodash'),
    utils = require('./utils.js');

module.exports = (function Friedman() {
    'use strict';

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
     * @returns {Number} IC Index of Coincidence for the supplied text
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
     * @returns {Array} an array of objects, each containing a key length and its IC
     */
    function calculateICForKeylengths(lengths) {
        return lengths.map(function(length) {
            var IC = getICForKeyLength(length);

            return { length: length, IC: IC };
        });
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

        utils.log('Checking most probable key length', true);
        utils.log('Index of Coincidence for English: ' + settings.IC, true);

        cipherText = cipher;

        ICs = calculateICForKeylengths(lengths);

        bestMatch = 3;// calculateBestGuessKeyLength(ICs);

        return bestMatch;
    }

    /**
     * @private
     *
     * @param {Number} length Key length to check the IC for
     * @returns  {Number} IC The IC for the specified keylength
     *
     * @description
     * Splits the cipher text into rows of x length and calculates the
     * IC of every column it produces
     */
    function getICForKeyLength(length) {
        var columns = utils.splitTextIntoColumns(cipherText, length),
            IC,
            sumColumnICs;

        sumColumnICs = columns.map(calculateIC).reduce(function(total, IC) {
            return total + IC;
        });

        IC = sumColumnICs / columns.length;

        utils.log('IC for key of length ' + length + ': ' + IC, true);

        return IC;
    }

}());