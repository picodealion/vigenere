var utils = require('./utils.js');

function Friedman() {
    'use strict';

    var cipherText,
        IC_ENGLISH = 1.73;

    return {
        findBestKeyLength: findBestKeyLength
    };

    /**
     * @private
     *
     * @param {Array} lengths An array of possible key lengths for the cipher
     * @returns {Array} an array of objects, each containing a key length and its IC
     */
    function calculateICForKeylengths(lengths) {
        return lengths.map(function(keyLength) {
            var IC = getICForKeyLength(keyLength);

            return { keyLength: keyLength, IC: IC };
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

        utils.log('Checking most probable key length');
        utils.log('Index of Coincidence for English:', IC_ENGLISH);

        cipherText = cipher;

        ICs = calculateICForKeylengths(lengths);
        bestMatch = ICs.sort(sortByClosestIC)[0];

        utils.log('Best guess for key length:', bestMatch.keyLength);

        return bestMatch.keyLength;
    }

    /**
     * @private
     *
     * @param {Number} keyLength Key length to check the IC for
     * @returns  {Number} IC The IC for the specified keylength
     *
     * @description
     * Splits the cipher text into rows of x length and calculates the
     * IC of every column it produces
     */
    function getICForKeyLength(keyLength) {
        var columns = utils.splitTextIntoColumns(cipherText, keyLength),
            IC,
            sumColumnICs;

        sumColumnICs = columns.map(utils.calculateIC).reduce(function(total, IC) {
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

module.exports = Friedman();