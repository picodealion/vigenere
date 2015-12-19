(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Vigenere = require('./vigenere.js');

Vigenere.init({
    minLength: 4,
    maxLength: 12
});
},{"./vigenere.js":6}],2:[function(require,module,exports){
var utils = require('./utils.js');

function FrequencyAnalyzer() {
    'use strict';

    var cipherText;

    return {
        getKey: getKey
    };

    function getKey(cipher, keyLength) {
        cipherText = cipher;

        return cipherText.substr(0, keyLength);
    }

}

module.exports = FrequencyAnalyzer();
},{"./utils.js":5}],3:[function(require,module,exports){
var utils = require('./utils.js');

function Friedman() {
    'use strict';

    var cipherText,
        settings = {
            IC: 1.73, // Index of Coincidence for English
            letters: 26 // letters in English alphabet
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
            return total + (count / text.length) * ((count - 1) / (text.length - 1));
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
        utils.log('Index of Coincidence for English:', settings.IC);

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

        sumColumnICs = columns.map(calculateIC).reduce(function(total, IC) {
            return total + IC;
        });

        IC = sumColumnICs / columns.length;

        utils.log('IC for key of length', keyLength + ':', IC);

        return IC;
    }

    function sortByClosestIC(a, b) {
        return Math.abs(a.IC - settings.IC) > Math.abs(b.IC - settings.IC);
    }

}

module.exports = Friedman();
},{"./utils.js":5}],4:[function(require,module,exports){
var utils = require('./utils.js');

function Kasiski() {
    'use strict';

    var cipherText;

    return {
        guessKeyLength: guessKeyLength
    };

    function guessKeyLength(cipher, minLength, maxLength) {
        var distances,
            GCDs,
            recurringStrings;

        cipherText = cipher;

        recurringStrings = getRecurringStrings(minLength, maxLength);
        distances = getDistances(recurringStrings);
        GCDs = getGreatestCommonDenominators(distances);

        utils.log('Most probable key lengths:', GCDs);

        return GCDs;
    }

    function getDistances(recurringStrings) {
        var allDistances,
            currentDistances,
            i;

        utils.log('Distances between recurring strings:');

        allDistances = recurringStrings.map(function(item) {
            currentDistances = [];

            for (i = 0; i < item.positions.length - 1; i++) {
                currentDistances.push(item.positions[i + 1] - item.positions[i]);
            }

            return currentDistances;
        }).reduce(function(all, current) {
            return all.concat(current);
        });

        utils.log(allDistances);

        return allDistances;
    }

    function getGreatestCommonDenominators(numbers) {
        var factorCount,
            factors,
            GCDs;

        factors = numbers.reduce(function(all, current) {
            return all.concat(utils.getFactors(current, 3));
        }, []);

        factorCount = factors.reduce(function(counted, current) {
            counted[current] = ++counted[current] || 1;
            return counted;
        }, {});

        GCDs = factors.filter(utils.unique).sort(function(a, b) {
            return factorCount[b] - factorCount[a];
        });

        return GCDs.slice(0, 3);
    }

    function getRecurringStrings(minLength, maxLength) {
        var recurring = [];

        for(var i = maxLength; i >= minLength; i--) {
            recurring = recurring.concat(getRecurringStringsOfLength(i));
        }

        if(recurring.length > 0)
            utils.log("Recurring strings:", recurring.map(function(item) { return item.string; }));
        else {
            utils.log('No recurring strings found :(. Either the key is too long or the ciphertext is too short to break the code.');
        }

        return recurring;
    }

    function getRecurringStringsOfLength(length) {
        utils.log('Finding recurring strings of length', length);

        var count,
            pos = 0,
            recurring = [],
            regexp,
            string;

        while(pos < cipherText.length - length) {
            string = cipherText.substr(pos, length);
            regexp = new RegExp(string, 'g');
            count = cipherText.match(regexp).length;

            if(!string.match(' ') && count > 1) {
                utils.log(string, 'occurs', count, 'times');
                recurring.push(getStringPositions(string));
            }

            pos++;
        }

        return recurring;
    }

    function getStringPositions(string) {
        var match,
            regexp = new RegExp(string, 'g'),
            result = { string: string, positions: [] };

        while((match = regexp.exec(cipherText)) !== null) {
            result.positions.push(match.index);

            // replace match with spaces so we don't get overlapping results
            cipherText = utils.replaceWithSpaces(cipherText, match.index, match.index + string.length);
        }

        return result;
    }
}

module.exports = Kasiski();

},{"./utils.js":5}],5:[function(require,module,exports){
function Utils() {

    return {
        countLetters: countLetters,
        getFactors: getFactors,
        log: log,
        normalize: normalize,
        replaceWithSpaces: replaceWithSpaces,
        settings: settings,
        splitTextIntoColumns: splitTextIntoColumns,
        unique: unique
    };

    /**
     * @public
     *
     * @param {String} text Text to count each letter in
     * @returns {Array} counts Array with the frequency each letter was found in the text
     *
     * @todo: refactor to be more flexible and with more error checking
     */
    function countLetters(text) {
        var counts = new Array(26+1).join('0').split('').map(Number); // zero-filled array

        for(var i = 0; i < text.length; i++) {
            var charIndex = text.charCodeAt(i) - 97;
            counts[charIndex]++;
        }

        return counts;
    }

    function getFactors(number, min) {
        var factors = [],
            i;

        for(i = min; i < Math.floor(number / 2); i++) {
            if(number % i === 0) {
                factors.push(i);
            }
        }

        return factors;
    }

    function log()
    {
        var logElement = document.getElementById('log'),
            logline = document.createElement('span'),
            output = Array.prototype.slice.call(arguments).join(' ');

        logline.innerText = output;
        logline.className = "logline";

        logElement.appendChild(logline);
        logElement.scrollTop = logElement.scrollHeight;
    }

    function normalize(input)
    {
        return input.toLowerCase().replace(/[^a-z]/g, '');
    }

    function replaceWithSpaces(text, start, end) {
        var i,
            spaces = '';

        for(i = 0; i < (end - start); i++) {
            spaces += ' ';
        }

        return text.substring(0, start) + spaces + text.substring(end);
    }

    function settings(defaults, options) {
        var i;

        for(i in options) {
            if(options.hasOwnProperty(i)) {
                defaults[i] = options[i];
            }
        }

        return defaults;
    }

    /**
     * @private
     *
     * @param {String} text The text to split
     * @param {Number} amount Amount of columns to split the text in
     * @returns {Array} columns An array of strings, each consisting of every
     * nth letter in the cipher (where n ranges from 1 to the specified amount)
     *
     * @example
     * Given a text of "abcdefghijk" and an amount of 4 columns, will produce:
     *
     *    a b c d
     *    e f g h
     *    i j k
     *
     * The returned columns are then ['aei', 'bfj', 'cgk', 'dh']
     */
    function splitTextIntoColumns(text, amount) {
        var columns = [];

        for (var offset = 0; offset < amount; offset++) {
            var index = offset,
                column = '';

            while(text[index]) {
                column += text[index];
                index += amount;
            }

            columns.push(column);
        }

        return columns;
    }

    function unique(item, index, self) {
        return index === self.indexOf(item);
    }
}

module.exports = Utils();
},{}],6:[function(require,module,exports){
var Kasiski  = require('./modules/Kasiski'),
    FrequencyAnalyzer = require('./modules/FrequencyAnalyzer'),
    Friedman = require('./modules/Friedman'),
    utils    = require('./modules/utils');

module.exports = Vigenere();

function Vigenere() {
    var defaultSettings = {
            minLength: 3,
            maxLength: 12,
            elements: {
                input: document.getElementById('ciphertext'),
                output: document.getElementById('plaintext'),
                log: document.getElementById('log'),
                start: document.getElementById('decipher')
            }
        },
        settings,
        cipherText;

    return {
        init: init
    };

    function init(options) {
        utils.log('Welcome to Vigenere Decipher Engine BETA 0.1');

        settings = utils.settings(defaultSettings, options);

        settings.elements.start.addEventListener('click', start);
    }

    function start() {
        var bestKeyLength,
            key,
            probableKeyLengths;

        utils.log('Starting to decipher');
        cipherText = utils.normalize(settings.elements.input.value);

        utils.log('Step 1: Define probable key lengths using Kasiski method');
        probableKeyLengths = Kasiski.guessKeyLength(cipherText, settings.minLength, settings.maxLength);

        utils.log('Step 2: Check best matching key length using Friedman method');
        bestKeyLength = Friedman.findBestKeyLength(cipherText, probableKeyLengths);

        utils.log('Step 3: Perform frequency analyses to decipher key');
        key = FrequencyAnalyzer.getKey(cipherText, bestKeyLength);

        end(key);
    }

    function end(result) {
        utils.log('Finished all steps.');
        utils.log('Best guess:', result);
    }
}
},{"./modules/FrequencyAnalyzer":2,"./modules/Friedman":3,"./modules/Kasiski":4,"./modules/utils":5}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL2Zha2VfMTUxNmZmNWMuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvRnJlcXVlbmN5QW5hbHl6ZXIuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvRnJpZWRtYW4uanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvS2FzaXNraS5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy91dGlscy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvdmlnZW5lcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgVmlnZW5lcmUgPSByZXF1aXJlKCcuL3ZpZ2VuZXJlLmpzJyk7XG5cblZpZ2VuZXJlLmluaXQoe1xuICAgIG1pbkxlbmd0aDogNCxcbiAgICBtYXhMZW5ndGg6IDEyXG59KTsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG5cbmZ1bmN0aW9uIEZyZXF1ZW5jeUFuYWx5emVyKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBjaXBoZXJUZXh0O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0S2V5OiBnZXRLZXlcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0S2V5KGNpcGhlciwga2V5TGVuZ3RoKSB7XG4gICAgICAgIGNpcGhlclRleHQgPSBjaXBoZXI7XG5cbiAgICAgICAgcmV0dXJuIGNpcGhlclRleHQuc3Vic3RyKDAsIGtleUxlbmd0aCk7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRnJlcXVlbmN5QW5hbHl6ZXIoKTsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG5cbmZ1bmN0aW9uIEZyaWVkbWFuKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBjaXBoZXJUZXh0LFxuICAgICAgICBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIElDOiAxLjczLCAvLyBJbmRleCBvZiBDb2luY2lkZW5jZSBmb3IgRW5nbGlzaFxuICAgICAgICAgICAgbGV0dGVyczogMjYgLy8gbGV0dGVycyBpbiBFbmdsaXNoIGFscGhhYmV0XG4gICAgICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaW5kQmVzdEtleUxlbmd0aDogZmluZEJlc3RLZXlMZW5ndGhcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRleHQgdG8gY2FsY3VsYXRlIHRoZSBJbmRleCBvZiBDb2luY2lkZW5jZSBmb3JcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSBJQyBJbmRleCBvZiBDb2luY2lkZW5jZSBmb3IgdGhlIHN1cHBsaWVkIHRleHRcbiAgICAgKlxuICAgICAqIFNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JbmRleF9vZl9jb2luY2lkZW5jZSNDYWxjdWxhdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZUlDKHRleHQpIHtcbiAgICAgICAgdmFyIGxldHRlckNvdW50cyA9IHV0aWxzLmNvdW50TGV0dGVycyh0ZXh0KSxcbiAgICAgICAgICAgIElDLFxuICAgICAgICAgICAgc3VtO1xuXG4gICAgICAgIHN1bSA9IGxldHRlckNvdW50cy5yZWR1Y2UoZnVuY3Rpb24odG90YWwsIGNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdG90YWwgKyAoY291bnQgLyB0ZXh0Lmxlbmd0aCkgKiAoKGNvdW50IC0gMSkgLyAodGV4dC5sZW5ndGggLSAxKSk7XG4gICAgICAgIH0sIDApO1xuXG4gICAgICAgIC8vIE5vcm1hbGl6ZVxuICAgICAgICBJQyA9IHNldHRpbmdzLmxldHRlcnMgKiBzdW07XG5cbiAgICAgICAgcmV0dXJuIElDO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsZW5ndGhzIEFuIGFycmF5IG9mIHBvc3NpYmxlIGtleSBsZW5ndGhzIGZvciB0aGUgY2lwaGVyXG4gICAgICogQHJldHVybnMge0FycmF5fSBhbiBhcnJheSBvZiBvYmplY3RzLCBlYWNoIGNvbnRhaW5pbmcgYSBrZXkgbGVuZ3RoIGFuZCBpdHMgSUNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVJQ0ZvcktleWxlbmd0aHMobGVuZ3Rocykge1xuICAgICAgICByZXR1cm4gbGVuZ3Rocy5tYXAoZnVuY3Rpb24oa2V5TGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgSUMgPSBnZXRJQ0ZvcktleUxlbmd0aChrZXlMZW5ndGgpO1xuXG4gICAgICAgICAgICByZXR1cm4geyBrZXlMZW5ndGg6IGtleUxlbmd0aCwgSUM6IElDIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY2lwaGVyIFRoZSBjaXBoZXJ0ZXh0IHRvIGNoZWNrIHRoZSBiZXN0IG1hdGNoaW5nIGtleSBsZW5ndGggZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGVuZ3RocyBBIGxpc3Qgb2YgcG9zc2libGUga2V5IGxlbmd0aHMgKGFzIGRlZmluZWQgdXNpbmcgdGhlIEthc2lza2kgbWV0aG9kPykgXG4gICAgICogQHJldHVybnMge051bWJlcn0gYmVzdE1hdGNoIFRoZSBrZXkgbGVuZ3RoIHdpdGggdGhlIElDIGNsb3Nlc3QgdG8gdGhlIHRhcmdldCBsYW5ndWFnZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRCZXN0S2V5TGVuZ3RoKGNpcGhlciwgbGVuZ3Rocykge1xuICAgICAgICB2YXIgYmVzdE1hdGNoLFxuICAgICAgICAgICAgSUNzO1xuXG4gICAgICAgIHV0aWxzLmxvZygnQ2hlY2tpbmcgbW9zdCBwcm9iYWJsZSBrZXkgbGVuZ3RoJyk7XG4gICAgICAgIHV0aWxzLmxvZygnSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yIEVuZ2xpc2g6Jywgc2V0dGluZ3MuSUMpO1xuXG4gICAgICAgIGNpcGhlclRleHQgPSBjaXBoZXI7XG5cbiAgICAgICAgSUNzID0gY2FsY3VsYXRlSUNGb3JLZXlsZW5ndGhzKGxlbmd0aHMpO1xuICAgICAgICBiZXN0TWF0Y2ggPSBJQ3Muc29ydChzb3J0QnlDbG9zZXN0SUMpWzBdO1xuXG4gICAgICAgIHV0aWxzLmxvZygnQmVzdCBndWVzcyBmb3Iga2V5IGxlbmd0aDonLCBiZXN0TWF0Y2gua2V5TGVuZ3RoKTtcblxuICAgICAgICByZXR1cm4gYmVzdE1hdGNoLmtleUxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGtleUxlbmd0aCBLZXkgbGVuZ3RoIHRvIGNoZWNrIHRoZSBJQyBmb3JcbiAgICAgKiBAcmV0dXJucyAge051bWJlcn0gSUMgVGhlIElDIGZvciB0aGUgc3BlY2lmaWVkIGtleWxlbmd0aFxuICAgICAqXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICogU3BsaXRzIHRoZSBjaXBoZXIgdGV4dCBpbnRvIHJvd3Mgb2YgeCBsZW5ndGggYW5kIGNhbGN1bGF0ZXMgdGhlXG4gICAgICogSUMgb2YgZXZlcnkgY29sdW1uIGl0IHByb2R1Y2VzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SUNGb3JLZXlMZW5ndGgoa2V5TGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb2x1bW5zID0gdXRpbHMuc3BsaXRUZXh0SW50b0NvbHVtbnMoY2lwaGVyVGV4dCwga2V5TGVuZ3RoKSxcbiAgICAgICAgICAgIElDLFxuICAgICAgICAgICAgc3VtQ29sdW1uSUNzO1xuXG4gICAgICAgIHN1bUNvbHVtbklDcyA9IGNvbHVtbnMubWFwKGNhbGN1bGF0ZUlDKS5yZWR1Y2UoZnVuY3Rpb24odG90YWwsIElDKSB7XG4gICAgICAgICAgICByZXR1cm4gdG90YWwgKyBJQztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgSUMgPSBzdW1Db2x1bW5JQ3MgLyBjb2x1bW5zLmxlbmd0aDtcblxuICAgICAgICB1dGlscy5sb2coJ0lDIGZvciBrZXkgb2YgbGVuZ3RoJywga2V5TGVuZ3RoICsgJzonLCBJQyk7XG5cbiAgICAgICAgcmV0dXJuIElDO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNvcnRCeUNsb3Nlc3RJQyhhLCBiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmFicyhhLklDIC0gc2V0dGluZ3MuSUMpID4gTWF0aC5hYnMoYi5JQyAtIHNldHRpbmdzLklDKTtcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmllZG1hbigpOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcblxuZnVuY3Rpb24gS2FzaXNraSgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2lwaGVyVGV4dDtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGd1ZXNzS2V5TGVuZ3RoOiBndWVzc0tleUxlbmd0aFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBndWVzc0tleUxlbmd0aChjaXBoZXIsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHZhciBkaXN0YW5jZXMsXG4gICAgICAgICAgICBHQ0RzLFxuICAgICAgICAgICAgcmVjdXJyaW5nU3RyaW5ncztcblxuICAgICAgICBjaXBoZXJUZXh0ID0gY2lwaGVyO1xuXG4gICAgICAgIHJlY3VycmluZ1N0cmluZ3MgPSBnZXRSZWN1cnJpbmdTdHJpbmdzKG1pbkxlbmd0aCwgbWF4TGVuZ3RoKTtcbiAgICAgICAgZGlzdGFuY2VzID0gZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpO1xuICAgICAgICBHQ0RzID0gZ2V0R3JlYXRlc3RDb21tb25EZW5vbWluYXRvcnMoZGlzdGFuY2VzKTtcblxuICAgICAgICB1dGlscy5sb2coJ01vc3QgcHJvYmFibGUga2V5IGxlbmd0aHM6JywgR0NEcyk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpIHtcbiAgICAgICAgdmFyIGFsbERpc3RhbmNlcyxcbiAgICAgICAgICAgIGN1cnJlbnREaXN0YW5jZXMsXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnRGlzdGFuY2VzIGJldHdlZW4gcmVjdXJyaW5nIHN0cmluZ3M6Jyk7XG5cbiAgICAgICAgYWxsRGlzdGFuY2VzID0gcmVjdXJyaW5nU3RyaW5ncy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgY3VycmVudERpc3RhbmNlcyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5wb3NpdGlvbnMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudERpc3RhbmNlcy5wdXNoKGl0ZW0ucG9zaXRpb25zW2kgKyAxXSAtIGl0ZW0ucG9zaXRpb25zW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREaXN0YW5jZXM7XG4gICAgICAgIH0pLnJlZHVjZShmdW5jdGlvbihhbGwsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGwuY29uY2F0KGN1cnJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICB1dGlscy5sb2coYWxsRGlzdGFuY2VzKTtcblxuICAgICAgICByZXR1cm4gYWxsRGlzdGFuY2VzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEdyZWF0ZXN0Q29tbW9uRGVub21pbmF0b3JzKG51bWJlcnMpIHtcbiAgICAgICAgdmFyIGZhY3RvckNvdW50LFxuICAgICAgICAgICAgZmFjdG9ycyxcbiAgICAgICAgICAgIEdDRHM7XG5cbiAgICAgICAgZmFjdG9ycyA9IG51bWJlcnMucmVkdWNlKGZ1bmN0aW9uKGFsbCwgY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbC5jb25jYXQodXRpbHMuZ2V0RmFjdG9ycyhjdXJyZW50LCAzKSk7XG4gICAgICAgIH0sIFtdKTtcblxuICAgICAgICBmYWN0b3JDb3VudCA9IGZhY3RvcnMucmVkdWNlKGZ1bmN0aW9uKGNvdW50ZWQsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNvdW50ZWRbY3VycmVudF0gPSArK2NvdW50ZWRbY3VycmVudF0gfHwgMTtcbiAgICAgICAgICAgIHJldHVybiBjb3VudGVkO1xuICAgICAgICB9LCB7fSk7XG5cbiAgICAgICAgR0NEcyA9IGZhY3RvcnMuZmlsdGVyKHV0aWxzLnVuaXF1ZSkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yQ291bnRbYl0gLSBmYWN0b3JDb3VudFthXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHMuc2xpY2UoMCwgMyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UmVjdXJyaW5nU3RyaW5ncyhtaW5MZW5ndGgsIG1heExlbmd0aCkge1xuICAgICAgICB2YXIgcmVjdXJyaW5nID0gW107XG5cbiAgICAgICAgZm9yKHZhciBpID0gbWF4TGVuZ3RoOyBpID49IG1pbkxlbmd0aDsgaS0tKSB7XG4gICAgICAgICAgICByZWN1cnJpbmcgPSByZWN1cnJpbmcuY29uY2F0KGdldFJlY3VycmluZ1N0cmluZ3NPZkxlbmd0aChpKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihyZWN1cnJpbmcubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHV0aWxzLmxvZyhcIlJlY3VycmluZyBzdHJpbmdzOlwiLCByZWN1cnJpbmcubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uc3RyaW5nOyB9KSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMubG9nKCdObyByZWN1cnJpbmcgc3RyaW5ncyBmb3VuZCA6KC4gRWl0aGVyIHRoZSBrZXkgaXMgdG9vIGxvbmcgb3IgdGhlIGNpcGhlcnRleHQgaXMgdG9vIHNob3J0IHRvIGJyZWFrIHRoZSBjb2RlLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlY3VycmluZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRSZWN1cnJpbmdTdHJpbmdzT2ZMZW5ndGgobGVuZ3RoKSB7XG4gICAgICAgIHV0aWxzLmxvZygnRmluZGluZyByZWN1cnJpbmcgc3RyaW5ncyBvZiBsZW5ndGgnLCBsZW5ndGgpO1xuXG4gICAgICAgIHZhciBjb3VudCxcbiAgICAgICAgICAgIHBvcyA9IDAsXG4gICAgICAgICAgICByZWN1cnJpbmcgPSBbXSxcbiAgICAgICAgICAgIHJlZ2V4cCxcbiAgICAgICAgICAgIHN0cmluZztcblxuICAgICAgICB3aGlsZShwb3MgPCBjaXBoZXJUZXh0Lmxlbmd0aCAtIGxlbmd0aCkge1xuICAgICAgICAgICAgc3RyaW5nID0gY2lwaGVyVGV4dC5zdWJzdHIocG9zLCBsZW5ndGgpO1xuICAgICAgICAgICAgcmVnZXhwID0gbmV3IFJlZ0V4cChzdHJpbmcsICdnJyk7XG4gICAgICAgICAgICBjb3VudCA9IGNpcGhlclRleHQubWF0Y2gocmVnZXhwKS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmKCFzdHJpbmcubWF0Y2goJyAnKSAmJiBjb3VudCA+IDEpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coc3RyaW5nLCAnb2NjdXJzJywgY291bnQsICd0aW1lcycpO1xuICAgICAgICAgICAgICAgIHJlY3VycmluZy5wdXNoKGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9zKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVjdXJyaW5nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpIHtcbiAgICAgICAgdmFyIG1hdGNoLFxuICAgICAgICAgICAgcmVnZXhwID0gbmV3IFJlZ0V4cChzdHJpbmcsICdnJyksXG4gICAgICAgICAgICByZXN1bHQgPSB7IHN0cmluZzogc3RyaW5nLCBwb3NpdGlvbnM6IFtdIH07XG5cbiAgICAgICAgd2hpbGUoKG1hdGNoID0gcmVnZXhwLmV4ZWMoY2lwaGVyVGV4dCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQucG9zaXRpb25zLnB1c2gobWF0Y2guaW5kZXgpO1xuXG4gICAgICAgICAgICAvLyByZXBsYWNlIG1hdGNoIHdpdGggc3BhY2VzIHNvIHdlIGRvbid0IGdldCBvdmVybGFwcGluZyByZXN1bHRzXG4gICAgICAgICAgICBjaXBoZXJUZXh0ID0gdXRpbHMucmVwbGFjZVdpdGhTcGFjZXMoY2lwaGVyVGV4dCwgbWF0Y2guaW5kZXgsIG1hdGNoLmluZGV4ICsgc3RyaW5nLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBLYXNpc2tpKCk7XG4iLCJmdW5jdGlvbiBVdGlscygpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGNvdW50TGV0dGVyczogY291bnRMZXR0ZXJzLFxuICAgICAgICBnZXRGYWN0b3JzOiBnZXRGYWN0b3JzLFxuICAgICAgICBsb2c6IGxvZyxcbiAgICAgICAgbm9ybWFsaXplOiBub3JtYWxpemUsXG4gICAgICAgIHJlcGxhY2VXaXRoU3BhY2VzOiByZXBsYWNlV2l0aFNwYWNlcyxcbiAgICAgICAgc2V0dGluZ3M6IHNldHRpbmdzLFxuICAgICAgICBzcGxpdFRleHRJbnRvQ29sdW1uczogc3BsaXRUZXh0SW50b0NvbHVtbnMsXG4gICAgICAgIHVuaXF1ZTogdW5pcXVlXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRleHQgdG8gY291bnQgZWFjaCBsZXR0ZXIgaW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGNvdW50cyBBcnJheSB3aXRoIHRoZSBmcmVxdWVuY3kgZWFjaCBsZXR0ZXIgd2FzIGZvdW5kIGluIHRoZSB0ZXh0XG4gICAgICpcbiAgICAgKiBAdG9kbzogcmVmYWN0b3IgdG8gYmUgbW9yZSBmbGV4aWJsZSBhbmQgd2l0aCBtb3JlIGVycm9yIGNoZWNraW5nXG4gICAgICovXG4gICAgZnVuY3Rpb24gY291bnRMZXR0ZXJzKHRleHQpIHtcbiAgICAgICAgdmFyIGNvdW50cyA9IG5ldyBBcnJheSgyNisxKS5qb2luKCcwJykuc3BsaXQoJycpLm1hcChOdW1iZXIpOyAvLyB6ZXJvLWZpbGxlZCBhcnJheVxuXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hhckluZGV4ID0gdGV4dC5jaGFyQ29kZUF0KGkpIC0gOTc7XG4gICAgICAgICAgICBjb3VudHNbY2hhckluZGV4XSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvdW50cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRGYWN0b3JzKG51bWJlciwgbWluKSB7XG4gICAgICAgIHZhciBmYWN0b3JzID0gW10sXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGZvcihpID0gbWluOyBpIDwgTWF0aC5mbG9vcihudW1iZXIgLyAyKTsgaSsrKSB7XG4gICAgICAgICAgICBpZihudW1iZXIgJSBpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmFjdG9ycy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhY3RvcnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9nKClcbiAgICB7XG4gICAgICAgIHZhciBsb2dFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZycpLFxuICAgICAgICAgICAgbG9nbGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgICAgIG91dHB1dCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykuam9pbignICcpO1xuXG4gICAgICAgIGxvZ2xpbmUuaW5uZXJUZXh0ID0gb3V0cHV0O1xuICAgICAgICBsb2dsaW5lLmNsYXNzTmFtZSA9IFwibG9nbGluZVwiO1xuXG4gICAgICAgIGxvZ0VsZW1lbnQuYXBwZW5kQ2hpbGQobG9nbGluZSk7XG4gICAgICAgIGxvZ0VsZW1lbnQuc2Nyb2xsVG9wID0gbG9nRWxlbWVudC5zY3JvbGxIZWlnaHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplKGlucHV0KVxuICAgIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXpdL2csICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlV2l0aFNwYWNlcyh0ZXh0LCBzdGFydCwgZW5kKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgc3BhY2VzID0gJyc7XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgKGVuZCAtIHN0YXJ0KTsgaSsrKSB7XG4gICAgICAgICAgICBzcGFjZXMgKz0gJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0KSArIHNwYWNlcyArIHRleHQuc3Vic3RyaW5nKGVuZCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dGluZ3MoZGVmYXVsdHMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgZm9yKGkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGRlZmF1bHRzW2ldID0gb3B0aW9uc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gc3BsaXRcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYW1vdW50IEFtb3VudCBvZiBjb2x1bW5zIHRvIHNwbGl0IHRoZSB0ZXh0IGluXG4gICAgICogQHJldHVybnMge0FycmF5fSBjb2x1bW5zIEFuIGFycmF5IG9mIHN0cmluZ3MsIGVhY2ggY29uc2lzdGluZyBvZiBldmVyeVxuICAgICAqIG50aCBsZXR0ZXIgaW4gdGhlIGNpcGhlciAod2hlcmUgbiByYW5nZXMgZnJvbSAxIHRvIHRoZSBzcGVjaWZpZWQgYW1vdW50KVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBHaXZlbiBhIHRleHQgb2YgXCJhYmNkZWZnaGlqa1wiIGFuZCBhbiBhbW91bnQgb2YgNCBjb2x1bW5zLCB3aWxsIHByb2R1Y2U6XG4gICAgICpcbiAgICAgKiAgICBhIGIgYyBkXG4gICAgICogICAgZSBmIGcgaFxuICAgICAqICAgIGkgaiBrXG4gICAgICpcbiAgICAgKiBUaGUgcmV0dXJuZWQgY29sdW1ucyBhcmUgdGhlbiBbJ2FlaScsICdiZmonLCAnY2drJywgJ2RoJ11cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzcGxpdFRleHRJbnRvQ29sdW1ucyh0ZXh0LCBhbW91bnQpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBvZmZzZXQgPSAwOyBvZmZzZXQgPCBhbW91bnQ7IG9mZnNldCsrKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBvZmZzZXQsXG4gICAgICAgICAgICAgICAgY29sdW1uID0gJyc7XG5cbiAgICAgICAgICAgIHdoaWxlKHRleHRbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgY29sdW1uICs9IHRleHRbaW5kZXhdO1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IGFtb3VudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29sdW1ucy5wdXNoKGNvbHVtbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29sdW1ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlxdWUoaXRlbSwgaW5kZXgsIHNlbGYpIHtcbiAgICAgICAgcmV0dXJuIGluZGV4ID09PSBzZWxmLmluZGV4T2YoaXRlbSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzKCk7IiwidmFyIEthc2lza2kgID0gcmVxdWlyZSgnLi9tb2R1bGVzL0thc2lza2knKSxcbiAgICBGcmVxdWVuY3lBbmFseXplciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9GcmVxdWVuY3lBbmFseXplcicpLFxuICAgIEZyaWVkbWFuID0gcmVxdWlyZSgnLi9tb2R1bGVzL0ZyaWVkbWFuJyksXG4gICAgdXRpbHMgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvdXRpbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWdlbmVyZSgpO1xuXG5mdW5jdGlvbiBWaWdlbmVyZSgpIHtcbiAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0ge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAxMixcbiAgICAgICAgICAgIGVsZW1lbnRzOiB7XG4gICAgICAgICAgICAgICAgaW5wdXQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXBoZXJ0ZXh0JyksXG4gICAgICAgICAgICAgICAgb3V0cHV0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxhaW50ZXh0JyksXG4gICAgICAgICAgICAgICAgbG9nOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nJyksXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWNpcGhlcicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNldHRpbmdzLFxuICAgICAgICBjaXBoZXJUZXh0O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdDogaW5pdFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBpbml0KG9wdGlvbnMpIHtcbiAgICAgICAgdXRpbHMubG9nKCdXZWxjb21lIHRvIFZpZ2VuZXJlIERlY2lwaGVyIEVuZ2luZSBCRVRBIDAuMScpO1xuXG4gICAgICAgIHNldHRpbmdzID0gdXRpbHMuc2V0dGluZ3MoZGVmYXVsdFNldHRpbmdzLCBvcHRpb25zKTtcblxuICAgICAgICBzZXR0aW5ncy5lbGVtZW50cy5zdGFydC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN0YXJ0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgdmFyIGJlc3RLZXlMZW5ndGgsXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBwcm9iYWJsZUtleUxlbmd0aHM7XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGFydGluZyB0byBkZWNpcGhlcicpO1xuICAgICAgICBjaXBoZXJUZXh0ID0gdXRpbHMubm9ybWFsaXplKHNldHRpbmdzLmVsZW1lbnRzLmlucHV0LnZhbHVlKTtcblxuICAgICAgICB1dGlscy5sb2coJ1N0ZXAgMTogRGVmaW5lIHByb2JhYmxlIGtleSBsZW5ndGhzIHVzaW5nIEthc2lza2kgbWV0aG9kJyk7XG4gICAgICAgIHByb2JhYmxlS2V5TGVuZ3RocyA9IEthc2lza2kuZ3Vlc3NLZXlMZW5ndGgoY2lwaGVyVGV4dCwgc2V0dGluZ3MubWluTGVuZ3RoLCBzZXR0aW5ncy5tYXhMZW5ndGgpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnU3RlcCAyOiBDaGVjayBiZXN0IG1hdGNoaW5nIGtleSBsZW5ndGggdXNpbmcgRnJpZWRtYW4gbWV0aG9kJyk7XG4gICAgICAgIGJlc3RLZXlMZW5ndGggPSBGcmllZG1hbi5maW5kQmVzdEtleUxlbmd0aChjaXBoZXJUZXh0LCBwcm9iYWJsZUtleUxlbmd0aHMpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnU3RlcCAzOiBQZXJmb3JtIGZyZXF1ZW5jeSBhbmFseXNlcyB0byBkZWNpcGhlciBrZXknKTtcbiAgICAgICAga2V5ID0gRnJlcXVlbmN5QW5hbHl6ZXIuZ2V0S2V5KGNpcGhlclRleHQsIGJlc3RLZXlMZW5ndGgpO1xuXG4gICAgICAgIGVuZChrZXkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuZChyZXN1bHQpIHtcbiAgICAgICAgdXRpbHMubG9nKCdGaW5pc2hlZCBhbGwgc3RlcHMuJyk7XG4gICAgICAgIHV0aWxzLmxvZygnQmVzdCBndWVzczonLCByZXN1bHQpO1xuICAgIH1cbn0iXX0=
