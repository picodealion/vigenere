var strings = require('./Strings'),
    utils   = require('./Utils');

function IC() {
    'use strict';

    var IC_ENGLISH = 1.73;

    return {
        calculateIC: calculateIC,
        calculateICForKeyLengths: calculateICForKeyLengths,
        getICForKeyLength: getICForKeyLength,
        sortByClosestIC: sortByClosestIC
    };

    /**
     * @public
     *
     * @param {String} text Text to calculate the Index of Coincidence for
     * @returns {Number} IC Index of Coincidence for the supplied text
     *
     * See https://en.wikipedia.org/wiki/Index_of_coincidence#Calculation
     */
    function calculateIC(text) {
        var letterCounts = strings.countLetters(text),
            IC,
            sum;

        sum = letterCounts.reduce(function(total, count) {
            return total + (count / text.length) * ((count - 1) / (text.length - 1));
        }, 0);

        IC = 26 * sum;

        return IC;
    }


    /**
     * @private
     *
     * @param {String} text Text to get the ICs for
     * @param {Array} lengths An array of possible key lengths for the cipher
     * @returns {Array} an array of objects, each containing a key length and its IC
     */
    function calculateICForKeyLengths(text, lengths) {
        return lengths.map(function(keyLength) {
            var IC = getICForKeyLength(text, keyLength);

            return { keyLength: keyLength, IC: IC };
        });
    }

    /**
     * @private
     *
     * @param {String} text Text to check IC for
     * @param {Number} keyLength Key length to check IC for
     * @returns  {Number} IC The IC for the specified text and keylength
     *
     * @description
     * Splits the text into rows of x length and calculates the
     * IC of every column it produces
     */
    function getICForKeyLength(text, keyLength) {
        var columns = strings.splitTextIntoColumns(text, keyLength),
            IC,
            sumColumnICs;

        sumColumnICs = columns.map(calculateIC).reduce(function(total, IC) {
            return total + IC;
        });

        IC = sumColumnICs / columns.length;

        utils.log('IC for key of length', keyLength + ':', IC);

        return IC;
    }

    function sortByClosestIC(a, b) {
        return Math.abs(a.IC - IC_ENGLISH) > Math.abs(b.IC - IC_ENGLISH);
    }
}

module.exports = IC();