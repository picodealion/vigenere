(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Vigenere = require('./vigenere.js');

Vigenere.init();
},{"./vigenere.js":6}],2:[function(require,module,exports){
var utils = require('./utils.js');

function FrequencyAnalyzer() {
    'use strict';

    return {
        getKey: getKey
    };

    function getKey(cipherText, keyLength) {
        var columns,
            i,
            key = '';

        columns = utils.splitTextIntoColumns(cipherText, keyLength);

        for(i = 0; i < keyLength; i++) {
            utils.log('Finding key letter', i+1, 'of', keyLength);
            key += findShiftLetter(columns[i]);
        }

        return cipherText.substr(0, keyLength);
    }

    function findShiftLetter(text) {
        var i,
            shifted = [];

        for(i = 0; i < 26; i++) {
            shifted.push({
                shift: i,
                text: shiftText(text, i),
                ic: utils.calculateIC(text)
            });
        }
    }

    function shiftText(text, shift) {
        return text.split('').map(function(char) {
            var letterIndex = char.charCodeAt() - 97,
                newLetter = (letterIndex + shift) % 26;

            return String.fromCharCode(newLetter + 97);
        }).join('');
    }
}

module.exports = FrequencyAnalyzer();
},{"./utils.js":5}],3:[function(require,module,exports){
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
        calculateIC: calculateIC,
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
     * @param {String} text Text to calculate the Index of Coincidence for
     * @returns {Number} IC Index of Coincidence for the supplied text
     *
     * See https://en.wikipedia.org/wiki/Index_of_coincidence#Calculation
     */
    function calculateIC(text) {
        var letterCounts = countLetters(text),
            IC,
            sum;

        sum = letterCounts.reduce(function(total, count) {
            return total + (count / text.length) * ((count - 1) / (text.length - 1));
        }, 0);

        // Normalize
        IC = 26 * sum;

        return IC;
    }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL2Zha2VfYTYwNjk5OTUuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvRnJlcXVlbmN5QW5hbHl6ZXIuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvRnJpZWRtYW4uanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvS2FzaXNraS5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy91dGlscy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvdmlnZW5lcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgVmlnZW5lcmUgPSByZXF1aXJlKCcuL3ZpZ2VuZXJlLmpzJyk7XG5cblZpZ2VuZXJlLmluaXQoKTsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG5cbmZ1bmN0aW9uIEZyZXF1ZW5jeUFuYWx5emVyKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldEtleTogZ2V0S2V5XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdldEtleShjaXBoZXJUZXh0LCBrZXlMZW5ndGgpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAga2V5ID0gJyc7XG5cbiAgICAgICAgY29sdW1ucyA9IHV0aWxzLnNwbGl0VGV4dEludG9Db2x1bW5zKGNpcGhlclRleHQsIGtleUxlbmd0aCk7XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwga2V5TGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZygnRmluZGluZyBrZXkgbGV0dGVyJywgaSsxLCAnb2YnLCBrZXlMZW5ndGgpO1xuICAgICAgICAgICAga2V5ICs9IGZpbmRTaGlmdExldHRlcihjb2x1bW5zW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaXBoZXJUZXh0LnN1YnN0cigwLCBrZXlMZW5ndGgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmRTaGlmdExldHRlcih0ZXh0KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgc2hpZnRlZCA9IFtdO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IDI2OyBpKyspIHtcbiAgICAgICAgICAgIHNoaWZ0ZWQucHVzaCh7XG4gICAgICAgICAgICAgICAgc2hpZnQ6IGksXG4gICAgICAgICAgICAgICAgdGV4dDogc2hpZnRUZXh0KHRleHQsIGkpLFxuICAgICAgICAgICAgICAgIGljOiB1dGlscy5jYWxjdWxhdGVJQyh0ZXh0KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGlmdFRleHQodGV4dCwgc2hpZnQpIHtcbiAgICAgICAgcmV0dXJuIHRleHQuc3BsaXQoJycpLm1hcChmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgICAgICB2YXIgbGV0dGVySW5kZXggPSBjaGFyLmNoYXJDb2RlQXQoKSAtIDk3LFxuICAgICAgICAgICAgICAgIG5ld0xldHRlciA9IChsZXR0ZXJJbmRleCArIHNoaWZ0KSAlIDI2O1xuXG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShuZXdMZXR0ZXIgKyA5Nyk7XG4gICAgICAgIH0pLmpvaW4oJycpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmVxdWVuY3lBbmFseXplcigpOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcblxuZnVuY3Rpb24gRnJpZWRtYW4oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNpcGhlclRleHQsXG4gICAgICAgIElDX0VOR0xJU0ggPSAxLjczO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZEJlc3RLZXlMZW5ndGg6IGZpbmRCZXN0S2V5TGVuZ3RoXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsZW5ndGhzIEFuIGFycmF5IG9mIHBvc3NpYmxlIGtleSBsZW5ndGhzIGZvciB0aGUgY2lwaGVyXG4gICAgICogQHJldHVybnMge0FycmF5fSBhbiBhcnJheSBvZiBvYmplY3RzLCBlYWNoIGNvbnRhaW5pbmcgYSBrZXkgbGVuZ3RoIGFuZCBpdHMgSUNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVJQ0ZvcktleWxlbmd0aHMobGVuZ3Rocykge1xuICAgICAgICByZXR1cm4gbGVuZ3Rocy5tYXAoZnVuY3Rpb24oa2V5TGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgSUMgPSBnZXRJQ0ZvcktleUxlbmd0aChrZXlMZW5ndGgpO1xuXG4gICAgICAgICAgICByZXR1cm4geyBrZXlMZW5ndGg6IGtleUxlbmd0aCwgSUM6IElDIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY2lwaGVyIFRoZSBjaXBoZXJ0ZXh0IHRvIGNoZWNrIHRoZSBiZXN0IG1hdGNoaW5nIGtleSBsZW5ndGggZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGVuZ3RocyBBIGxpc3Qgb2YgcG9zc2libGUga2V5IGxlbmd0aHMgKGFzIGRlZmluZWQgdXNpbmcgdGhlIEthc2lza2kgbWV0aG9kPykgXG4gICAgICogQHJldHVybnMge051bWJlcn0gYmVzdE1hdGNoIFRoZSBrZXkgbGVuZ3RoIHdpdGggdGhlIElDIGNsb3Nlc3QgdG8gdGhlIHRhcmdldCBsYW5ndWFnZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRCZXN0S2V5TGVuZ3RoKGNpcGhlciwgbGVuZ3Rocykge1xuICAgICAgICB2YXIgYmVzdE1hdGNoLFxuICAgICAgICAgICAgSUNzO1xuXG4gICAgICAgIHV0aWxzLmxvZygnQ2hlY2tpbmcgbW9zdCBwcm9iYWJsZSBrZXkgbGVuZ3RoJyk7XG4gICAgICAgIHV0aWxzLmxvZygnSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yIEVuZ2xpc2g6JywgSUNfRU5HTElTSCk7XG5cbiAgICAgICAgY2lwaGVyVGV4dCA9IGNpcGhlcjtcblxuICAgICAgICBJQ3MgPSBjYWxjdWxhdGVJQ0ZvcktleWxlbmd0aHMobGVuZ3Rocyk7XG4gICAgICAgIGJlc3RNYXRjaCA9IElDcy5zb3J0KHNvcnRCeUNsb3Nlc3RJQylbMF07XG5cbiAgICAgICAgdXRpbHMubG9nKCdCZXN0IGd1ZXNzIGZvciBrZXkgbGVuZ3RoOicsIGJlc3RNYXRjaC5rZXlMZW5ndGgpO1xuXG4gICAgICAgIHJldHVybiBiZXN0TWF0Y2gua2V5TGVuZ3RoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0ga2V5TGVuZ3RoIEtleSBsZW5ndGggdG8gY2hlY2sgdGhlIElDIGZvclxuICAgICAqIEByZXR1cm5zICB7TnVtYmVyfSBJQyBUaGUgSUMgZm9yIHRoZSBzcGVjaWZpZWQga2V5bGVuZ3RoXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBTcGxpdHMgdGhlIGNpcGhlciB0ZXh0IGludG8gcm93cyBvZiB4IGxlbmd0aCBhbmQgY2FsY3VsYXRlcyB0aGVcbiAgICAgKiBJQyBvZiBldmVyeSBjb2x1bW4gaXQgcHJvZHVjZXNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRJQ0ZvcktleUxlbmd0aChrZXlMZW5ndGgpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSB1dGlscy5zcGxpdFRleHRJbnRvQ29sdW1ucyhjaXBoZXJUZXh0LCBrZXlMZW5ndGgpLFxuICAgICAgICAgICAgSUMsXG4gICAgICAgICAgICBzdW1Db2x1bW5JQ3M7XG5cbiAgICAgICAgc3VtQ29sdW1uSUNzID0gY29sdW1ucy5tYXAodXRpbHMuY2FsY3VsYXRlSUMpLnJlZHVjZShmdW5jdGlvbih0b3RhbCwgSUMpIHtcbiAgICAgICAgICAgIHJldHVybiB0b3RhbCArIElDO1xuICAgICAgICB9KTtcblxuICAgICAgICBJQyA9IHN1bUNvbHVtbklDcyAvIGNvbHVtbnMubGVuZ3RoO1xuXG4gICAgICAgIHV0aWxzLmxvZygnSUMgZm9yIGtleSBvZiBsZW5ndGgnLCBrZXlMZW5ndGggKyAnOicsIElDKTtcblxuICAgICAgICByZXR1cm4gSUM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc29ydEJ5Q2xvc2VzdElDKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKGEuSUMgLSBJQ19FTkdMSVNIKSA+IE1hdGguYWJzKGIuSUMgLSBJQ19FTkdMSVNIKTtcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGcmllZG1hbigpOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcblxuZnVuY3Rpb24gS2FzaXNraSgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2lwaGVyVGV4dDtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGd1ZXNzS2V5TGVuZ3RoOiBndWVzc0tleUxlbmd0aFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBndWVzc0tleUxlbmd0aChjaXBoZXIsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHZhciBkaXN0YW5jZXMsXG4gICAgICAgICAgICBHQ0RzLFxuICAgICAgICAgICAgcmVjdXJyaW5nU3RyaW5ncztcblxuICAgICAgICBjaXBoZXJUZXh0ID0gY2lwaGVyO1xuXG4gICAgICAgIHJlY3VycmluZ1N0cmluZ3MgPSBnZXRSZWN1cnJpbmdTdHJpbmdzKG1pbkxlbmd0aCwgbWF4TGVuZ3RoKTtcbiAgICAgICAgZGlzdGFuY2VzID0gZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpO1xuICAgICAgICBHQ0RzID0gZ2V0R3JlYXRlc3RDb21tb25EZW5vbWluYXRvcnMoZGlzdGFuY2VzKTtcblxuICAgICAgICB1dGlscy5sb2coJ01vc3QgcHJvYmFibGUga2V5IGxlbmd0aHM6JywgR0NEcyk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpIHtcbiAgICAgICAgdmFyIGFsbERpc3RhbmNlcyxcbiAgICAgICAgICAgIGN1cnJlbnREaXN0YW5jZXMsXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnRGlzdGFuY2VzIGJldHdlZW4gcmVjdXJyaW5nIHN0cmluZ3M6Jyk7XG5cbiAgICAgICAgYWxsRGlzdGFuY2VzID0gcmVjdXJyaW5nU3RyaW5ncy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgY3VycmVudERpc3RhbmNlcyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5wb3NpdGlvbnMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudERpc3RhbmNlcy5wdXNoKGl0ZW0ucG9zaXRpb25zW2kgKyAxXSAtIGl0ZW0ucG9zaXRpb25zW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREaXN0YW5jZXM7XG4gICAgICAgIH0pLnJlZHVjZShmdW5jdGlvbihhbGwsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGwuY29uY2F0KGN1cnJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICB1dGlscy5sb2coYWxsRGlzdGFuY2VzKTtcblxuICAgICAgICByZXR1cm4gYWxsRGlzdGFuY2VzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEdyZWF0ZXN0Q29tbW9uRGVub21pbmF0b3JzKG51bWJlcnMpIHtcbiAgICAgICAgdmFyIGZhY3RvckNvdW50LFxuICAgICAgICAgICAgZmFjdG9ycyxcbiAgICAgICAgICAgIEdDRHM7XG5cbiAgICAgICAgZmFjdG9ycyA9IG51bWJlcnMucmVkdWNlKGZ1bmN0aW9uKGFsbCwgY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbC5jb25jYXQodXRpbHMuZ2V0RmFjdG9ycyhjdXJyZW50LCAzKSk7XG4gICAgICAgIH0sIFtdKTtcblxuICAgICAgICBmYWN0b3JDb3VudCA9IGZhY3RvcnMucmVkdWNlKGZ1bmN0aW9uKGNvdW50ZWQsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNvdW50ZWRbY3VycmVudF0gPSArK2NvdW50ZWRbY3VycmVudF0gfHwgMTtcbiAgICAgICAgICAgIHJldHVybiBjb3VudGVkO1xuICAgICAgICB9LCB7fSk7XG5cbiAgICAgICAgR0NEcyA9IGZhY3RvcnMuZmlsdGVyKHV0aWxzLnVuaXF1ZSkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yQ291bnRbYl0gLSBmYWN0b3JDb3VudFthXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHMuc2xpY2UoMCwgMyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UmVjdXJyaW5nU3RyaW5ncyhtaW5MZW5ndGgsIG1heExlbmd0aCkge1xuICAgICAgICB2YXIgcmVjdXJyaW5nID0gW107XG5cbiAgICAgICAgZm9yKHZhciBpID0gbWF4TGVuZ3RoOyBpID49IG1pbkxlbmd0aDsgaS0tKSB7XG4gICAgICAgICAgICByZWN1cnJpbmcgPSByZWN1cnJpbmcuY29uY2F0KGdldFJlY3VycmluZ1N0cmluZ3NPZkxlbmd0aChpKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihyZWN1cnJpbmcubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHV0aWxzLmxvZyhcIlJlY3VycmluZyBzdHJpbmdzOlwiLCByZWN1cnJpbmcubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uc3RyaW5nOyB9KSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMubG9nKCdObyByZWN1cnJpbmcgc3RyaW5ncyBmb3VuZCA6KC4gRWl0aGVyIHRoZSBrZXkgaXMgdG9vIGxvbmcgb3IgdGhlIGNpcGhlcnRleHQgaXMgdG9vIHNob3J0IHRvIGJyZWFrIHRoZSBjb2RlLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlY3VycmluZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRSZWN1cnJpbmdTdHJpbmdzT2ZMZW5ndGgobGVuZ3RoKSB7XG4gICAgICAgIHV0aWxzLmxvZygnRmluZGluZyByZWN1cnJpbmcgc3RyaW5ncyBvZiBsZW5ndGgnLCBsZW5ndGgpO1xuXG4gICAgICAgIHZhciBjb3VudCxcbiAgICAgICAgICAgIHBvcyA9IDAsXG4gICAgICAgICAgICByZWN1cnJpbmcgPSBbXSxcbiAgICAgICAgICAgIHJlZ2V4cCxcbiAgICAgICAgICAgIHN0cmluZztcblxuICAgICAgICB3aGlsZShwb3MgPCBjaXBoZXJUZXh0Lmxlbmd0aCAtIGxlbmd0aCkge1xuICAgICAgICAgICAgc3RyaW5nID0gY2lwaGVyVGV4dC5zdWJzdHIocG9zLCBsZW5ndGgpO1xuICAgICAgICAgICAgcmVnZXhwID0gbmV3IFJlZ0V4cChzdHJpbmcsICdnJyk7XG4gICAgICAgICAgICBjb3VudCA9IGNpcGhlclRleHQubWF0Y2gocmVnZXhwKS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmKCFzdHJpbmcubWF0Y2goJyAnKSAmJiBjb3VudCA+IDEpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coc3RyaW5nLCAnb2NjdXJzJywgY291bnQsICd0aW1lcycpO1xuICAgICAgICAgICAgICAgIHJlY3VycmluZy5wdXNoKGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9zKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVjdXJyaW5nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpIHtcbiAgICAgICAgdmFyIG1hdGNoLFxuICAgICAgICAgICAgcmVnZXhwID0gbmV3IFJlZ0V4cChzdHJpbmcsICdnJyksXG4gICAgICAgICAgICByZXN1bHQgPSB7IHN0cmluZzogc3RyaW5nLCBwb3NpdGlvbnM6IFtdIH07XG5cbiAgICAgICAgd2hpbGUoKG1hdGNoID0gcmVnZXhwLmV4ZWMoY2lwaGVyVGV4dCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQucG9zaXRpb25zLnB1c2gobWF0Y2guaW5kZXgpO1xuXG4gICAgICAgICAgICAvLyByZXBsYWNlIG1hdGNoIHdpdGggc3BhY2VzIHNvIHdlIGRvbid0IGdldCBvdmVybGFwcGluZyByZXN1bHRzXG4gICAgICAgICAgICBjaXBoZXJUZXh0ID0gdXRpbHMucmVwbGFjZVdpdGhTcGFjZXMoY2lwaGVyVGV4dCwgbWF0Y2guaW5kZXgsIG1hdGNoLmluZGV4ICsgc3RyaW5nLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBLYXNpc2tpKCk7XG4iLCJmdW5jdGlvbiBVdGlscygpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGNhbGN1bGF0ZUlDOiBjYWxjdWxhdGVJQyxcbiAgICAgICAgY291bnRMZXR0ZXJzOiBjb3VudExldHRlcnMsXG4gICAgICAgIGdldEZhY3RvcnM6IGdldEZhY3RvcnMsXG4gICAgICAgIGxvZzogbG9nLFxuICAgICAgICBub3JtYWxpemU6IG5vcm1hbGl6ZSxcbiAgICAgICAgcmVwbGFjZVdpdGhTcGFjZXM6IHJlcGxhY2VXaXRoU3BhY2VzLFxuICAgICAgICBzZXR0aW5nczogc2V0dGluZ3MsXG4gICAgICAgIHNwbGl0VGV4dEludG9Db2x1bW5zOiBzcGxpdFRleHRJbnRvQ29sdW1ucyxcbiAgICAgICAgdW5pcXVlOiB1bmlxdWVcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUZXh0IHRvIGNhbGN1bGF0ZSB0aGUgSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yXG4gICAgICogQHJldHVybnMge051bWJlcn0gSUMgSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yIHRoZSBzdXBwbGllZCB0ZXh0XG4gICAgICpcbiAgICAgKiBTZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSW5kZXhfb2ZfY29pbmNpZGVuY2UjQ2FsY3VsYXRpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVJQyh0ZXh0KSB7XG4gICAgICAgIHZhciBsZXR0ZXJDb3VudHMgPSBjb3VudExldHRlcnModGV4dCksXG4gICAgICAgICAgICBJQyxcbiAgICAgICAgICAgIHN1bTtcblxuICAgICAgICBzdW0gPSBsZXR0ZXJDb3VudHMucmVkdWNlKGZ1bmN0aW9uKHRvdGFsLCBjb3VudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRvdGFsICsgKGNvdW50IC8gdGV4dC5sZW5ndGgpICogKChjb3VudCAtIDEpIC8gKHRleHQubGVuZ3RoIC0gMSkpO1xuICAgICAgICB9LCAwKTtcblxuICAgICAgICAvLyBOb3JtYWxpemVcbiAgICAgICAgSUMgPSAyNiAqIHN1bTtcblxuICAgICAgICByZXR1cm4gSUM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGV4dCB0byBjb3VudCBlYWNoIGxldHRlciBpblxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gY291bnRzIEFycmF5IHdpdGggdGhlIGZyZXF1ZW5jeSBlYWNoIGxldHRlciB3YXMgZm91bmQgaW4gdGhlIHRleHRcbiAgICAgKlxuICAgICAqIEB0b2RvOiByZWZhY3RvciB0byBiZSBtb3JlIGZsZXhpYmxlIGFuZCB3aXRoIG1vcmUgZXJyb3IgY2hlY2tpbmdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb3VudExldHRlcnModGV4dCkge1xuICAgICAgICB2YXIgY291bnRzID0gbmV3IEFycmF5KDI2KzEpLmpvaW4oJzAnKS5zcGxpdCgnJykubWFwKE51bWJlcik7IC8vIHplcm8tZmlsbGVkIGFycmF5XG5cbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGFySW5kZXggPSB0ZXh0LmNoYXJDb2RlQXQoaSkgLSA5NztcbiAgICAgICAgICAgIGNvdW50c1tjaGFySW5kZXhdKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY291bnRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEZhY3RvcnMobnVtYmVyLCBtaW4pIHtcbiAgICAgICAgdmFyIGZhY3RvcnMgPSBbXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgZm9yKGkgPSBtaW47IGkgPCBNYXRoLmZsb29yKG51bWJlciAvIDIpOyBpKyspIHtcbiAgICAgICAgICAgIGlmKG51bWJlciAlIGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmYWN0b3JzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFjdG9ycztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2coKVxuICAgIHtcbiAgICAgICAgdmFyIGxvZ0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nJyksXG4gICAgICAgICAgICBsb2dsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxuICAgICAgICAgICAgb3V0cHV0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5qb2luKCcgJyk7XG5cbiAgICAgICAgbG9nbGluZS5pbm5lclRleHQgPSBvdXRwdXQ7XG4gICAgICAgIGxvZ2xpbmUuY2xhc3NOYW1lID0gXCJsb2dsaW5lXCI7XG5cbiAgICAgICAgbG9nRWxlbWVudC5hcHBlbmRDaGlsZChsb2dsaW5lKTtcbiAgICAgICAgbG9nRWxlbWVudC5zY3JvbGxUb3AgPSBsb2dFbGVtZW50LnNjcm9sbEhlaWdodDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemUoaW5wdXQpXG4gICAge1xuICAgICAgICByZXR1cm4gaW5wdXQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtel0vZywgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlcGxhY2VXaXRoU3BhY2VzKHRleHQsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBzcGFjZXMgPSAnJztcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCAoZW5kIC0gc3RhcnQpOyBpKyspIHtcbiAgICAgICAgICAgIHNwYWNlcyArPSAnICc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGV4dC5zdWJzdHJpbmcoMCwgc3RhcnQpICsgc3BhY2VzICsgdGV4dC5zdWJzdHJpbmcoZW5kKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR0aW5ncyhkZWZhdWx0cywgb3B0aW9ucykge1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IoaSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZihvcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdHNbaV0gPSBvcHRpb25zW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0byBzcGxpdFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhbW91bnQgQW1vdW50IG9mIGNvbHVtbnMgdG8gc3BsaXQgdGhlIHRleHQgaW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGNvbHVtbnMgQW4gYXJyYXkgb2Ygc3RyaW5ncywgZWFjaCBjb25zaXN0aW5nIG9mIGV2ZXJ5XG4gICAgICogbnRoIGxldHRlciBpbiB0aGUgY2lwaGVyICh3aGVyZSBuIHJhbmdlcyBmcm9tIDEgdG8gdGhlIHNwZWNpZmllZCBhbW91bnQpXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIEdpdmVuIGEgdGV4dCBvZiBcImFiY2RlZmdoaWprXCIgYW5kIGFuIGFtb3VudCBvZiA0IGNvbHVtbnMsIHdpbGwgcHJvZHVjZTpcbiAgICAgKlxuICAgICAqICAgIGEgYiBjIGRcbiAgICAgKiAgICBlIGYgZyBoXG4gICAgICogICAgaSBqIGtcbiAgICAgKlxuICAgICAqIFRoZSByZXR1cm5lZCBjb2x1bW5zIGFyZSB0aGVuIFsnYWVpJywgJ2JmaicsICdjZ2snLCAnZGgnXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNwbGl0VGV4dEludG9Db2x1bW5zKHRleHQsIGFtb3VudCkge1xuICAgICAgICB2YXIgY29sdW1ucyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIG9mZnNldCA9IDA7IG9mZnNldCA8IGFtb3VudDsgb2Zmc2V0KyspIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IG9mZnNldCxcbiAgICAgICAgICAgICAgICBjb2x1bW4gPSAnJztcblxuICAgICAgICAgICAgd2hpbGUodGV4dFtpbmRleF0pIHtcbiAgICAgICAgICAgICAgICBjb2x1bW4gKz0gdGV4dFtpbmRleF07XG4gICAgICAgICAgICAgICAgaW5kZXggKz0gYW1vdW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb2x1bW5zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaXF1ZShpdGVtLCBpbmRleCwgc2VsZikge1xuICAgICAgICByZXR1cm4gaW5kZXggPT09IHNlbGYuaW5kZXhPZihpdGVtKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbHMoKTsiLCJ2YXIgS2FzaXNraSAgPSByZXF1aXJlKCcuL21vZHVsZXMvS2FzaXNraScpLFxuICAgIEZyZXF1ZW5jeUFuYWx5emVyID0gcmVxdWlyZSgnLi9tb2R1bGVzL0ZyZXF1ZW5jeUFuYWx5emVyJyksXG4gICAgRnJpZWRtYW4gPSByZXF1aXJlKCcuL21vZHVsZXMvRnJpZWRtYW4nKSxcbiAgICB1dGlscyAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy91dGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZ2VuZXJlKCk7XG5cbmZ1bmN0aW9uIFZpZ2VuZXJlKCkge1xuICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBtaW5MZW5ndGg6IDMsXG4gICAgICAgICAgICBtYXhMZW5ndGg6IDEyLFxuICAgICAgICAgICAgZWxlbWVudHM6IHtcbiAgICAgICAgICAgICAgICBpbnB1dDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcGhlcnRleHQnKSxcbiAgICAgICAgICAgICAgICBvdXRwdXQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGFpbnRleHQnKSxcbiAgICAgICAgICAgICAgICBsb2c6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2cnKSxcbiAgICAgICAgICAgICAgICBzdGFydDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlY2lwaGVyJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0dGluZ3MsXG4gICAgICAgIGNpcGhlclRleHQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBpbml0XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGluaXQob3B0aW9ucykge1xuICAgICAgICB1dGlscy5sb2coJ1dlbGNvbWUgdG8gVmlnZW5lcmUgRGVjaXBoZXIgRW5naW5lIEJFVEEgMC4xJyk7XG5cbiAgICAgICAgc2V0dGluZ3MgPSB1dGlscy5zZXR0aW5ncyhkZWZhdWx0U2V0dGluZ3MsIG9wdGlvbnMpO1xuXG4gICAgICAgIHNldHRpbmdzLmVsZW1lbnRzLnN0YXJ0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3RhcnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICB2YXIgYmVzdEtleUxlbmd0aCxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHByb2JhYmxlS2V5TGVuZ3RocztcblxuICAgICAgICB1dGlscy5sb2coJ1N0YXJ0aW5nIHRvIGRlY2lwaGVyJyk7XG4gICAgICAgIGNpcGhlclRleHQgPSB1dGlscy5ub3JtYWxpemUoc2V0dGluZ3MuZWxlbWVudHMuaW5wdXQudmFsdWUpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnU3RlcCAxOiBEZWZpbmUgcHJvYmFibGUga2V5IGxlbmd0aHMgdXNpbmcgS2FzaXNraSBtZXRob2QnKTtcbiAgICAgICAgcHJvYmFibGVLZXlMZW5ndGhzID0gS2FzaXNraS5ndWVzc0tleUxlbmd0aChjaXBoZXJUZXh0LCBzZXR0aW5ncy5taW5MZW5ndGgsIHNldHRpbmdzLm1heExlbmd0aCk7XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGVwIDI6IENoZWNrIGJlc3QgbWF0Y2hpbmcga2V5IGxlbmd0aCB1c2luZyBGcmllZG1hbiBtZXRob2QnKTtcbiAgICAgICAgYmVzdEtleUxlbmd0aCA9IEZyaWVkbWFuLmZpbmRCZXN0S2V5TGVuZ3RoKGNpcGhlclRleHQsIHByb2JhYmxlS2V5TGVuZ3Rocyk7XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGVwIDM6IFBlcmZvcm0gZnJlcXVlbmN5IGFuYWx5c2VzIHRvIGRlY2lwaGVyIGtleScpO1xuICAgICAgICBrZXkgPSBGcmVxdWVuY3lBbmFseXplci5nZXRLZXkoY2lwaGVyVGV4dCwgYmVzdEtleUxlbmd0aCk7XG5cbiAgICAgICAgZW5kKGtleSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5kKHJlc3VsdCkge1xuICAgICAgICB1dGlscy5sb2coJ0ZpbmlzaGVkIGFsbCBzdGVwcy4nKTtcbiAgICAgICAgdXRpbHMubG9nKCdCZXN0IGd1ZXNzOicsIHJlc3VsdCk7XG4gICAgfVxufSJdfQ==
