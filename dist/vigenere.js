(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var vigenere = require('./modules/Vigenere');

vigenere.init();
},{"./modules/Vigenere":7}],2:[function(require,module,exports){
var IC    = require('./IndexOfCoincidence'),
    utils = require('./Utils');

function Caesar() {
    'use strict';

    return {
        findShiftLetter: findShiftLetter,
        shiftText: shiftText
    };

    function findShiftLetter(text) {
        var i,
            shifted = [];

        for(i = 0; i < 26; i++) {
            shifted.push({
                shift: i,
                text: shiftText(text, i),
                ic: IC.calculateIC(text)
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

module.exports = Caesar();
},{"./IndexOfCoincidence":4,"./Utils":6}],3:[function(require,module,exports){
var utils = require('./Utils');

function GCD() {
    'use strict';

    return {
        getFactors: getFactors,
        getGCDs: getGCDs
    };

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

    function getGCDs(numbers) {
        var factorCount,
            factors,
            GCDs;

        factors = numbers.reduce(function(all, current) {
            return all.concat(getFactors(current, 3));
        }, []);

        factorCount = factors.reduce(function(counted, current) {
            counted[current] = ++counted[current] || 1;
            return counted;
        }, {});

        GCDs = factors.filter(utils.uniqueFilter).sort(function(a, b) {
            return factorCount[b] - factorCount[a];
        });

        return GCDs.slice(0, 3);
    }
}

module.exports = GCD();
},{"./Utils":6}],4:[function(require,module,exports){
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
},{"./Strings":5,"./Utils":6}],5:[function(require,module,exports){
var utils = require('./Utils');

function Strings() {

    // eewwww
    var tempText;

    return {
        countLetters: countLetters,
        getRecurringStrings: getRecurringStrings,
        replaceWithSpaces: replaceWithSpaces,
        splitTextIntoColumns: splitTextIntoColumns
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
        var counts = [],
            i;

        for(i = 0; i < 26; i++) {
            counts.push(0);
        }

        for(i = 0; i < text.length; i++) {
            var charIndex = text.charCodeAt(i) - 97;
            counts[charIndex]++;
        }

        return counts;
    }

    function getRecurringStrings(text, minLength, maxLength) {
        var recurring = [];

        tempText = text;

        for(var i = maxLength; i >= minLength; i--) {
            recurring = recurring.concat(getRecurringStringsOfLength(i));
        }

        if(recurring.length > 0)
            utils.log("Recurring strings:", recurring.map(function(item) { return item.string; }));
        else {
            utils.log('No recurring strings found :(');
        }

        tempText = null;

        return recurring;
    }

    function getRecurringStringsOfLength(length) {
        utils.log('Finding recurring strings of length', length);

        var count,
            pos = 0,
            recurring = [],
            regexp,
            string;

        while(pos < tempText.length - length) {
            string = tempText.substr(pos, length);
            regexp = new RegExp(string, 'g');
            count = tempText.match(regexp).length;

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

        while((match = regexp.exec(tempText)) !== null) {
            result.positions.push(match.index);

            // replace match with spaces so we don't get overlapping results
            tempText = replaceWithSpaces(tempText, match.index, match.index + string.length);
        }

        return result;
    }

    function replaceWithSpaces(text, start, end) {
        var i,
            spaces = '';

        for(i = 0; i < (end - start); i++) {
            spaces += ' ';
        }

        return text.substring(0, start) + spaces + text.substring(end);
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
}

module.exports = Strings();
},{"./Utils":6}],6:[function(require,module,exports){
function Utils() {

    return {
        applySettings: applySettings,
        getDistances: getDistances,
        log: log,
        normalize: normalize,
        uniqueFilter: uniqueFilter
    };

    function applySettings(defaults, options) {
        var i;

        for(i in options) {
            if(options.hasOwnProperty(i)) {
                defaults[i] = options[i];
            }
        }

        return defaults;
    }

    function getDistances(recurringStrings) {
        var allDistances,
            currentDistances,
            i;

        log('Distances between recurring strings:');

        allDistances = recurringStrings.map(function(item) {
            currentDistances = [];

            for (i = 0; i < item.positions.length - 1; i++) {
                currentDistances.push(item.positions[i + 1] - item.positions[i]);
            }

            return currentDistances;
        }).reduce(function(all, current) {
            return all.concat(current);
        });

        log(allDistances);

        return allDistances;
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


    function uniqueFilter(item, index, self) {
        return index === self.indexOf(item);
    }
}

module.exports = Utils();
},{}],7:[function(require,module,exports){
var caesar  = require('./CaesarShiftCipher'),
    GCD     = require('./GreatestCommonDenominator'),
    IC      = require('./IndexOfCoincidence'),
    strings = require('./Strings'),
    utils   = require('./Utils');

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
        settings;

    return {
        init: init
    };

    function init(options) {
        utils.log('Welcome to Vigenere Decipher Engine BETA 0.1');

        settings = utils.applySettings(defaultSettings, options);

        settings.elements.start.addEventListener('click', start);
    }

    function start() {
        var bestKeyLength,
            cipherText,
            key,
            probableKeyLengths;

        utils.log('Starting to decipher');
        cipherText = utils.normalize(settings.elements.input.value);

        utils.log('Step 1: Define probable key lengths using Kasiski method');
        probableKeyLengths = guessKeyLengthsKasiski(cipherText, settings.minLength, settings.maxLength);

        utils.log('Step 2: Check best matching key length using Friedman method');
        bestKeyLength = findBestKeyLengthFriedman(cipherText, probableKeyLengths);

        utils.log('Step 3: Perform frequency analyses to decipher key');
        key = getKeyByFrequencyAnalysis(cipherText, bestKeyLength);

        end(key);
    }

    function end(result) {
        utils.log('Finished all steps.');
        utils.log('Best guess:', result);
    }

    function findBestKeyLengthFriedman(cipherText, lengths) {
        var bestMatch,
            ICs;

        utils.log('Checking most probable key length');

        ICs = IC.calculateICForKeyLengths(cipherText, lengths);
        bestMatch = ICs.sort(IC.sortByClosestIC)[0];

        utils.log('Best guess for key length:', bestMatch.keyLength);

        return bestMatch.keyLength;
    }

    function getKeyByFrequencyAnalysis(cipherText, keyLength) {
        var columns,
            i,
            key = '';

        columns = strings.splitTextIntoColumns(cipherText, keyLength);

        for(i = 0; i < keyLength; i++) {
            utils.log('Finding key letter', i+1, 'of', keyLength);
            key += caesar.findShiftLetter(columns[i]);
        }

        return cipherText.substr(0, keyLength);
    }

    function guessKeyLengthsKasiski(cipherText, minLength, maxLength) {
        var distances,
            GCDs,
            recurringStrings;

        recurringStrings = strings.getRecurringStrings(cipherText, minLength, maxLength);
        distances = utils.getDistances(recurringStrings);
        GCDs = GCD.getGCDs(distances);

        utils.log('Most probable key lengths:', GCDs);

        return GCDs;
    }

}
},{"./CaesarShiftCipher":2,"./GreatestCommonDenominator":3,"./IndexOfCoincidence":4,"./Strings":5,"./Utils":6}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL2Zha2VfOTNhOTg2NzMuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvQ2Flc2FyU2hpZnRDaXBoZXIuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvR3JlYXRlc3RDb21tb25EZW5vbWluYXRvci5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9JbmRleE9mQ29pbmNpZGVuY2UuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvU3RyaW5ncy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9VdGlscy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9WaWdlbmVyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHZpZ2VuZXJlID0gcmVxdWlyZSgnLi9tb2R1bGVzL1ZpZ2VuZXJlJyk7XG5cbnZpZ2VuZXJlLmluaXQoKTsiLCJ2YXIgSUMgICAgPSByZXF1aXJlKCcuL0luZGV4T2ZDb2luY2lkZW5jZScpLFxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xuXG5mdW5jdGlvbiBDYWVzYXIoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZFNoaWZ0TGV0dGVyOiBmaW5kU2hpZnRMZXR0ZXIsXG4gICAgICAgIHNoaWZ0VGV4dDogc2hpZnRUZXh0XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGZpbmRTaGlmdExldHRlcih0ZXh0KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgc2hpZnRlZCA9IFtdO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IDI2OyBpKyspIHtcbiAgICAgICAgICAgIHNoaWZ0ZWQucHVzaCh7XG4gICAgICAgICAgICAgICAgc2hpZnQ6IGksXG4gICAgICAgICAgICAgICAgdGV4dDogc2hpZnRUZXh0KHRleHQsIGkpLFxuICAgICAgICAgICAgICAgIGljOiBJQy5jYWxjdWxhdGVJQyh0ZXh0KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGlmdFRleHQodGV4dCwgc2hpZnQpIHtcbiAgICAgICAgcmV0dXJuIHRleHQuc3BsaXQoJycpLm1hcChmdW5jdGlvbihjaGFyKSB7XG4gICAgICAgICAgICB2YXIgbGV0dGVySW5kZXggPSBjaGFyLmNoYXJDb2RlQXQoKSAtIDk3LFxuICAgICAgICAgICAgICAgIG5ld0xldHRlciA9IChsZXR0ZXJJbmRleCArIHNoaWZ0KSAlIDI2O1xuXG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShuZXdMZXR0ZXIgKyA5Nyk7XG4gICAgICAgIH0pLmpvaW4oJycpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDYWVzYXIoKTsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbmZ1bmN0aW9uIEdDRCgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRGYWN0b3JzOiBnZXRGYWN0b3JzLFxuICAgICAgICBnZXRHQ0RzOiBnZXRHQ0RzXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdldEZhY3RvcnMobnVtYmVyLCBtaW4pIHtcbiAgICAgICAgdmFyIGZhY3RvcnMgPSBbXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgZm9yKGkgPSBtaW47IGkgPCBNYXRoLmZsb29yKG51bWJlciAvIDIpOyBpKyspIHtcbiAgICAgICAgICAgIGlmKG51bWJlciAlIGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmYWN0b3JzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFjdG9ycztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRHQ0RzKG51bWJlcnMpIHtcbiAgICAgICAgdmFyIGZhY3RvckNvdW50LFxuICAgICAgICAgICAgZmFjdG9ycyxcbiAgICAgICAgICAgIEdDRHM7XG5cbiAgICAgICAgZmFjdG9ycyA9IG51bWJlcnMucmVkdWNlKGZ1bmN0aW9uKGFsbCwgY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbC5jb25jYXQoZ2V0RmFjdG9ycyhjdXJyZW50LCAzKSk7XG4gICAgICAgIH0sIFtdKTtcblxuICAgICAgICBmYWN0b3JDb3VudCA9IGZhY3RvcnMucmVkdWNlKGZ1bmN0aW9uKGNvdW50ZWQsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNvdW50ZWRbY3VycmVudF0gPSArK2NvdW50ZWRbY3VycmVudF0gfHwgMTtcbiAgICAgICAgICAgIHJldHVybiBjb3VudGVkO1xuICAgICAgICB9LCB7fSk7XG5cbiAgICAgICAgR0NEcyA9IGZhY3RvcnMuZmlsdGVyKHV0aWxzLnVuaXF1ZUZpbHRlcikuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yQ291bnRbYl0gLSBmYWN0b3JDb3VudFthXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHMuc2xpY2UoMCwgMyk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdDRCgpOyIsInZhciBzdHJpbmdzID0gcmVxdWlyZSgnLi9TdHJpbmdzJyksXG4gICAgdXRpbHMgICA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuZnVuY3Rpb24gSUMoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIElDX0VOR0xJU0ggPSAxLjczO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2FsY3VsYXRlSUM6IGNhbGN1bGF0ZUlDLFxuICAgICAgICBjYWxjdWxhdGVJQ0ZvcktleUxlbmd0aHM6IGNhbGN1bGF0ZUlDRm9yS2V5TGVuZ3RocyxcbiAgICAgICAgZ2V0SUNGb3JLZXlMZW5ndGg6IGdldElDRm9yS2V5TGVuZ3RoLFxuICAgICAgICBzb3J0QnlDbG9zZXN0SUM6IHNvcnRCeUNsb3Nlc3RJQ1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUZXh0IHRvIGNhbGN1bGF0ZSB0aGUgSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yXG4gICAgICogQHJldHVybnMge051bWJlcn0gSUMgSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yIHRoZSBzdXBwbGllZCB0ZXh0XG4gICAgICpcbiAgICAgKiBTZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSW5kZXhfb2ZfY29pbmNpZGVuY2UjQ2FsY3VsYXRpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVJQyh0ZXh0KSB7XG4gICAgICAgIHZhciBsZXR0ZXJDb3VudHMgPSBzdHJpbmdzLmNvdW50TGV0dGVycyh0ZXh0KSxcbiAgICAgICAgICAgIElDLFxuICAgICAgICAgICAgc3VtO1xuXG4gICAgICAgIHN1bSA9IGxldHRlckNvdW50cy5yZWR1Y2UoZnVuY3Rpb24odG90YWwsIGNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdG90YWwgKyAoY291bnQgLyB0ZXh0Lmxlbmd0aCkgKiAoKGNvdW50IC0gMSkgLyAodGV4dC5sZW5ndGggLSAxKSk7XG4gICAgICAgIH0sIDApO1xuXG4gICAgICAgIElDID0gMjYgKiBzdW07XG5cbiAgICAgICAgcmV0dXJuIElDO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRleHQgdG8gZ2V0IHRoZSBJQ3MgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGVuZ3RocyBBbiBhcnJheSBvZiBwb3NzaWJsZSBrZXkgbGVuZ3RocyBmb3IgdGhlIGNpcGhlclxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBjb250YWluaW5nIGEga2V5IGxlbmd0aCBhbmQgaXRzIElDXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2FsY3VsYXRlSUNGb3JLZXlMZW5ndGhzKHRleHQsIGxlbmd0aHMpIHtcbiAgICAgICAgcmV0dXJuIGxlbmd0aHMubWFwKGZ1bmN0aW9uKGtleUxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIElDID0gZ2V0SUNGb3JLZXlMZW5ndGgodGV4dCwga2V5TGVuZ3RoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsga2V5TGVuZ3RoOiBrZXlMZW5ndGgsIElDOiBJQyB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGV4dCB0byBjaGVjayBJQyBmb3JcbiAgICAgKiBAcGFyYW0ge051bWJlcn0ga2V5TGVuZ3RoIEtleSBsZW5ndGggdG8gY2hlY2sgSUMgZm9yXG4gICAgICogQHJldHVybnMgIHtOdW1iZXJ9IElDIFRoZSBJQyBmb3IgdGhlIHNwZWNpZmllZCB0ZXh0IGFuZCBrZXlsZW5ndGhcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIFNwbGl0cyB0aGUgdGV4dCBpbnRvIHJvd3Mgb2YgeCBsZW5ndGggYW5kIGNhbGN1bGF0ZXMgdGhlXG4gICAgICogSUMgb2YgZXZlcnkgY29sdW1uIGl0IHByb2R1Y2VzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SUNGb3JLZXlMZW5ndGgodGV4dCwga2V5TGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb2x1bW5zID0gc3RyaW5ncy5zcGxpdFRleHRJbnRvQ29sdW1ucyh0ZXh0LCBrZXlMZW5ndGgpLFxuICAgICAgICAgICAgSUMsXG4gICAgICAgICAgICBzdW1Db2x1bW5JQ3M7XG5cbiAgICAgICAgc3VtQ29sdW1uSUNzID0gY29sdW1ucy5tYXAoY2FsY3VsYXRlSUMpLnJlZHVjZShmdW5jdGlvbih0b3RhbCwgSUMpIHtcbiAgICAgICAgICAgIHJldHVybiB0b3RhbCArIElDO1xuICAgICAgICB9KTtcblxuICAgICAgICBJQyA9IHN1bUNvbHVtbklDcyAvIGNvbHVtbnMubGVuZ3RoO1xuXG4gICAgICAgIHV0aWxzLmxvZygnSUMgZm9yIGtleSBvZiBsZW5ndGgnLCBrZXlMZW5ndGggKyAnOicsIElDKTtcblxuICAgICAgICByZXR1cm4gSUM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc29ydEJ5Q2xvc2VzdElDKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKGEuSUMgLSBJQ19FTkdMSVNIKSA+IE1hdGguYWJzKGIuSUMgLSBJQ19FTkdMSVNIKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSUMoKTsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbmZ1bmN0aW9uIFN0cmluZ3MoKSB7XG5cbiAgICAvLyBlZXd3d3dcbiAgICB2YXIgdGVtcFRleHQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjb3VudExldHRlcnM6IGNvdW50TGV0dGVycyxcbiAgICAgICAgZ2V0UmVjdXJyaW5nU3RyaW5nczogZ2V0UmVjdXJyaW5nU3RyaW5ncyxcbiAgICAgICAgcmVwbGFjZVdpdGhTcGFjZXM6IHJlcGxhY2VXaXRoU3BhY2VzLFxuICAgICAgICBzcGxpdFRleHRJbnRvQ29sdW1uczogc3BsaXRUZXh0SW50b0NvbHVtbnNcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGV4dCB0byBjb3VudCBlYWNoIGxldHRlciBpblxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gY291bnRzIEFycmF5IHdpdGggdGhlIGZyZXF1ZW5jeSBlYWNoIGxldHRlciB3YXMgZm91bmQgaW4gdGhlIHRleHRcbiAgICAgKlxuICAgICAqIEB0b2RvOiByZWZhY3RvciB0byBiZSBtb3JlIGZsZXhpYmxlIGFuZCB3aXRoIG1vcmUgZXJyb3IgY2hlY2tpbmdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb3VudExldHRlcnModGV4dCkge1xuICAgICAgICB2YXIgY291bnRzID0gW10sXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IDI2OyBpKyspIHtcbiAgICAgICAgICAgIGNvdW50cy5wdXNoKDApO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoYXJJbmRleCA9IHRleHQuY2hhckNvZGVBdChpKSAtIDk3O1xuICAgICAgICAgICAgY291bnRzW2NoYXJJbmRleF0rKztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb3VudHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UmVjdXJyaW5nU3RyaW5ncyh0ZXh0LCBtaW5MZW5ndGgsIG1heExlbmd0aCkge1xuICAgICAgICB2YXIgcmVjdXJyaW5nID0gW107XG5cbiAgICAgICAgdGVtcFRleHQgPSB0ZXh0O1xuXG4gICAgICAgIGZvcih2YXIgaSA9IG1heExlbmd0aDsgaSA+PSBtaW5MZW5ndGg7IGktLSkge1xuICAgICAgICAgICAgcmVjdXJyaW5nID0gcmVjdXJyaW5nLmNvbmNhdChnZXRSZWN1cnJpbmdTdHJpbmdzT2ZMZW5ndGgoaSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYocmVjdXJyaW5nLmxlbmd0aCA+IDApXG4gICAgICAgICAgICB1dGlscy5sb2coXCJSZWN1cnJpbmcgc3RyaW5nczpcIiwgcmVjdXJyaW5nLm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLnN0cmluZzsgfSkpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZygnTm8gcmVjdXJyaW5nIHN0cmluZ3MgZm91bmQgOignKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBUZXh0ID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gcmVjdXJyaW5nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFJlY3VycmluZ1N0cmluZ3NPZkxlbmd0aChsZW5ndGgpIHtcbiAgICAgICAgdXRpbHMubG9nKCdGaW5kaW5nIHJlY3VycmluZyBzdHJpbmdzIG9mIGxlbmd0aCcsIGxlbmd0aCk7XG5cbiAgICAgICAgdmFyIGNvdW50LFxuICAgICAgICAgICAgcG9zID0gMCxcbiAgICAgICAgICAgIHJlY3VycmluZyA9IFtdLFxuICAgICAgICAgICAgcmVnZXhwLFxuICAgICAgICAgICAgc3RyaW5nO1xuXG4gICAgICAgIHdoaWxlKHBvcyA8IHRlbXBUZXh0Lmxlbmd0aCAtIGxlbmd0aCkge1xuICAgICAgICAgICAgc3RyaW5nID0gdGVtcFRleHQuc3Vic3RyKHBvcywgbGVuZ3RoKTtcbiAgICAgICAgICAgIHJlZ2V4cCA9IG5ldyBSZWdFeHAoc3RyaW5nLCAnZycpO1xuICAgICAgICAgICAgY291bnQgPSB0ZW1wVGV4dC5tYXRjaChyZWdleHApLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYoIXN0cmluZy5tYXRjaCgnICcpICYmIGNvdW50ID4gMSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhzdHJpbmcsICdvY2N1cnMnLCBjb3VudCwgJ3RpbWVzJyk7XG4gICAgICAgICAgICAgICAgcmVjdXJyaW5nLnB1c2goZ2V0U3RyaW5nUG9zaXRpb25zKHN0cmluZykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb3MrKztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZWN1cnJpbmc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U3RyaW5nUG9zaXRpb25zKHN0cmluZykge1xuICAgICAgICB2YXIgbWF0Y2gsXG4gICAgICAgICAgICByZWdleHAgPSBuZXcgUmVnRXhwKHN0cmluZywgJ2cnKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHsgc3RyaW5nOiBzdHJpbmcsIHBvc2l0aW9uczogW10gfTtcblxuICAgICAgICB3aGlsZSgobWF0Y2ggPSByZWdleHAuZXhlYyh0ZW1wVGV4dCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQucG9zaXRpb25zLnB1c2gobWF0Y2guaW5kZXgpO1xuXG4gICAgICAgICAgICAvLyByZXBsYWNlIG1hdGNoIHdpdGggc3BhY2VzIHNvIHdlIGRvbid0IGdldCBvdmVybGFwcGluZyByZXN1bHRzXG4gICAgICAgICAgICB0ZW1wVGV4dCA9IHJlcGxhY2VXaXRoU3BhY2VzKHRlbXBUZXh0LCBtYXRjaC5pbmRleCwgbWF0Y2guaW5kZXggKyBzdHJpbmcubGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVwbGFjZVdpdGhTcGFjZXModGV4dCwgc3RhcnQsIGVuZCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIHNwYWNlcyA9ICcnO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IChlbmQgLSBzdGFydCk7IGkrKykge1xuICAgICAgICAgICAgc3BhY2VzICs9ICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZXh0LnN1YnN0cmluZygwLCBzdGFydCkgKyBzcGFjZXMgKyB0ZXh0LnN1YnN0cmluZyhlbmQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0byBzcGxpdFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhbW91bnQgQW1vdW50IG9mIGNvbHVtbnMgdG8gc3BsaXQgdGhlIHRleHQgaW5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGNvbHVtbnMgQW4gYXJyYXkgb2Ygc3RyaW5ncywgZWFjaCBjb25zaXN0aW5nIG9mIGV2ZXJ5XG4gICAgICogbnRoIGxldHRlciBpbiB0aGUgY2lwaGVyICh3aGVyZSBuIHJhbmdlcyBmcm9tIDEgdG8gdGhlIHNwZWNpZmllZCBhbW91bnQpXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIEdpdmVuIGEgdGV4dCBvZiBcImFiY2RlZmdoaWprXCIgYW5kIGFuIGFtb3VudCBvZiA0IGNvbHVtbnMsIHdpbGwgcHJvZHVjZTpcbiAgICAgKlxuICAgICAqICAgIGEgYiBjIGRcbiAgICAgKiAgICBlIGYgZyBoXG4gICAgICogICAgaSBqIGtcbiAgICAgKlxuICAgICAqIFRoZSByZXR1cm5lZCBjb2x1bW5zIGFyZSB0aGVuIFsnYWVpJywgJ2JmaicsICdjZ2snLCAnZGgnXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNwbGl0VGV4dEludG9Db2x1bW5zKHRleHQsIGFtb3VudCkge1xuICAgICAgICB2YXIgY29sdW1ucyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIG9mZnNldCA9IDA7IG9mZnNldCA8IGFtb3VudDsgb2Zmc2V0KyspIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IG9mZnNldCxcbiAgICAgICAgICAgICAgICBjb2x1bW4gPSAnJztcblxuICAgICAgICAgICAgd2hpbGUodGV4dFtpbmRleF0pIHtcbiAgICAgICAgICAgICAgICBjb2x1bW4gKz0gdGV4dFtpbmRleF07XG4gICAgICAgICAgICAgICAgaW5kZXggKz0gYW1vdW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb2x1bW5zO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpbmdzKCk7IiwiZnVuY3Rpb24gVXRpbHMoKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhcHBseVNldHRpbmdzOiBhcHBseVNldHRpbmdzLFxuICAgICAgICBnZXREaXN0YW5jZXM6IGdldERpc3RhbmNlcyxcbiAgICAgICAgbG9nOiBsb2csXG4gICAgICAgIG5vcm1hbGl6ZTogbm9ybWFsaXplLFxuICAgICAgICB1bmlxdWVGaWx0ZXI6IHVuaXF1ZUZpbHRlclxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhcHBseVNldHRpbmdzKGRlZmF1bHRzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGZvcihpIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0c1tpXSA9IG9wdGlvbnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpIHtcbiAgICAgICAgdmFyIGFsbERpc3RhbmNlcyxcbiAgICAgICAgICAgIGN1cnJlbnREaXN0YW5jZXMsXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGxvZygnRGlzdGFuY2VzIGJldHdlZW4gcmVjdXJyaW5nIHN0cmluZ3M6Jyk7XG5cbiAgICAgICAgYWxsRGlzdGFuY2VzID0gcmVjdXJyaW5nU3RyaW5ncy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgY3VycmVudERpc3RhbmNlcyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5wb3NpdGlvbnMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudERpc3RhbmNlcy5wdXNoKGl0ZW0ucG9zaXRpb25zW2kgKyAxXSAtIGl0ZW0ucG9zaXRpb25zW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREaXN0YW5jZXM7XG4gICAgICAgIH0pLnJlZHVjZShmdW5jdGlvbihhbGwsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGwuY29uY2F0KGN1cnJlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsb2coYWxsRGlzdGFuY2VzKTtcblxuICAgICAgICByZXR1cm4gYWxsRGlzdGFuY2VzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvZygpXG4gICAge1xuICAgICAgICB2YXIgbG9nRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2cnKSxcbiAgICAgICAgICAgIGxvZ2xpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyksXG4gICAgICAgICAgICBvdXRwdXQgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLmpvaW4oJyAnKTtcblxuICAgICAgICBsb2dsaW5lLmlubmVyVGV4dCA9IG91dHB1dDtcbiAgICAgICAgbG9nbGluZS5jbGFzc05hbWUgPSBcImxvZ2xpbmVcIjtcblxuICAgICAgICBsb2dFbGVtZW50LmFwcGVuZENoaWxkKGxvZ2xpbmUpO1xuICAgICAgICBsb2dFbGVtZW50LnNjcm9sbFRvcCA9IGxvZ0VsZW1lbnQuc2Nyb2xsSGVpZ2h0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShpbnB1dClcbiAgICB7XG4gICAgICAgIHJldHVybiBpbnB1dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teYS16XS9nLCAnJyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiB1bmlxdWVGaWx0ZXIoaXRlbSwgaW5kZXgsIHNlbGYpIHtcbiAgICAgICAgcmV0dXJuIGluZGV4ID09PSBzZWxmLmluZGV4T2YoaXRlbSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzKCk7IiwidmFyIGNhZXNhciAgPSByZXF1aXJlKCcuL0NhZXNhclNoaWZ0Q2lwaGVyJyksXG4gICAgR0NEICAgICA9IHJlcXVpcmUoJy4vR3JlYXRlc3RDb21tb25EZW5vbWluYXRvcicpLFxuICAgIElDICAgICAgPSByZXF1aXJlKCcuL0luZGV4T2ZDb2luY2lkZW5jZScpLFxuICAgIHN0cmluZ3MgPSByZXF1aXJlKCcuL1N0cmluZ3MnKSxcbiAgICB1dGlscyAgID0gcmVxdWlyZSgnLi9VdGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZ2VuZXJlKCk7XG5cbmZ1bmN0aW9uIFZpZ2VuZXJlKCkge1xuICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBtaW5MZW5ndGg6IDMsXG4gICAgICAgICAgICBtYXhMZW5ndGg6IDEyLFxuICAgICAgICAgICAgZWxlbWVudHM6IHtcbiAgICAgICAgICAgICAgICBpbnB1dDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcGhlcnRleHQnKSxcbiAgICAgICAgICAgICAgICBvdXRwdXQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGFpbnRleHQnKSxcbiAgICAgICAgICAgICAgICBsb2c6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2cnKSxcbiAgICAgICAgICAgICAgICBzdGFydDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlY2lwaGVyJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0dGluZ3M7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBpbml0XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGluaXQob3B0aW9ucykge1xuICAgICAgICB1dGlscy5sb2coJ1dlbGNvbWUgdG8gVmlnZW5lcmUgRGVjaXBoZXIgRW5naW5lIEJFVEEgMC4xJyk7XG5cbiAgICAgICAgc2V0dGluZ3MgPSB1dGlscy5hcHBseVNldHRpbmdzKGRlZmF1bHRTZXR0aW5ncywgb3B0aW9ucyk7XG5cbiAgICAgICAgc2V0dGluZ3MuZWxlbWVudHMuc3RhcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdGFydCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIHZhciBiZXN0S2V5TGVuZ3RoLFxuICAgICAgICAgICAgY2lwaGVyVGV4dCxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHByb2JhYmxlS2V5TGVuZ3RocztcblxuICAgICAgICB1dGlscy5sb2coJ1N0YXJ0aW5nIHRvIGRlY2lwaGVyJyk7XG4gICAgICAgIGNpcGhlclRleHQgPSB1dGlscy5ub3JtYWxpemUoc2V0dGluZ3MuZWxlbWVudHMuaW5wdXQudmFsdWUpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnU3RlcCAxOiBEZWZpbmUgcHJvYmFibGUga2V5IGxlbmd0aHMgdXNpbmcgS2FzaXNraSBtZXRob2QnKTtcbiAgICAgICAgcHJvYmFibGVLZXlMZW5ndGhzID0gZ3Vlc3NLZXlMZW5ndGhzS2FzaXNraShjaXBoZXJUZXh0LCBzZXR0aW5ncy5taW5MZW5ndGgsIHNldHRpbmdzLm1heExlbmd0aCk7XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGVwIDI6IENoZWNrIGJlc3QgbWF0Y2hpbmcga2V5IGxlbmd0aCB1c2luZyBGcmllZG1hbiBtZXRob2QnKTtcbiAgICAgICAgYmVzdEtleUxlbmd0aCA9IGZpbmRCZXN0S2V5TGVuZ3RoRnJpZWRtYW4oY2lwaGVyVGV4dCwgcHJvYmFibGVLZXlMZW5ndGhzKTtcblxuICAgICAgICB1dGlscy5sb2coJ1N0ZXAgMzogUGVyZm9ybSBmcmVxdWVuY3kgYW5hbHlzZXMgdG8gZGVjaXBoZXIga2V5Jyk7XG4gICAgICAgIGtleSA9IGdldEtleUJ5RnJlcXVlbmN5QW5hbHlzaXMoY2lwaGVyVGV4dCwgYmVzdEtleUxlbmd0aCk7XG5cbiAgICAgICAgZW5kKGtleSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5kKHJlc3VsdCkge1xuICAgICAgICB1dGlscy5sb2coJ0ZpbmlzaGVkIGFsbCBzdGVwcy4nKTtcbiAgICAgICAgdXRpbHMubG9nKCdCZXN0IGd1ZXNzOicsIHJlc3VsdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluZEJlc3RLZXlMZW5ndGhGcmllZG1hbihjaXBoZXJUZXh0LCBsZW5ndGhzKSB7XG4gICAgICAgIHZhciBiZXN0TWF0Y2gsXG4gICAgICAgICAgICBJQ3M7XG5cbiAgICAgICAgdXRpbHMubG9nKCdDaGVja2luZyBtb3N0IHByb2JhYmxlIGtleSBsZW5ndGgnKTtcblxuICAgICAgICBJQ3MgPSBJQy5jYWxjdWxhdGVJQ0ZvcktleUxlbmd0aHMoY2lwaGVyVGV4dCwgbGVuZ3Rocyk7XG4gICAgICAgIGJlc3RNYXRjaCA9IElDcy5zb3J0KElDLnNvcnRCeUNsb3Nlc3RJQylbMF07XG5cbiAgICAgICAgdXRpbHMubG9nKCdCZXN0IGd1ZXNzIGZvciBrZXkgbGVuZ3RoOicsIGJlc3RNYXRjaC5rZXlMZW5ndGgpO1xuXG4gICAgICAgIHJldHVybiBiZXN0TWF0Y2gua2V5TGVuZ3RoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEtleUJ5RnJlcXVlbmN5QW5hbHlzaXMoY2lwaGVyVGV4dCwga2V5TGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb2x1bW5zLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGtleSA9ICcnO1xuXG4gICAgICAgIGNvbHVtbnMgPSBzdHJpbmdzLnNwbGl0VGV4dEludG9Db2x1bW5zKGNpcGhlclRleHQsIGtleUxlbmd0aCk7XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwga2V5TGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZygnRmluZGluZyBrZXkgbGV0dGVyJywgaSsxLCAnb2YnLCBrZXlMZW5ndGgpO1xuICAgICAgICAgICAga2V5ICs9IGNhZXNhci5maW5kU2hpZnRMZXR0ZXIoY29sdW1uc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2lwaGVyVGV4dC5zdWJzdHIoMCwga2V5TGVuZ3RoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBndWVzc0tleUxlbmd0aHNLYXNpc2tpKGNpcGhlclRleHQsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHZhciBkaXN0YW5jZXMsXG4gICAgICAgICAgICBHQ0RzLFxuICAgICAgICAgICAgcmVjdXJyaW5nU3RyaW5ncztcblxuICAgICAgICByZWN1cnJpbmdTdHJpbmdzID0gc3RyaW5ncy5nZXRSZWN1cnJpbmdTdHJpbmdzKGNpcGhlclRleHQsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKTtcbiAgICAgICAgZGlzdGFuY2VzID0gdXRpbHMuZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpO1xuICAgICAgICBHQ0RzID0gR0NELmdldEdDRHMoZGlzdGFuY2VzKTtcblxuICAgICAgICB1dGlscy5sb2coJ01vc3QgcHJvYmFibGUga2V5IGxlbmd0aHM6JywgR0NEcyk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHM7XG4gICAgfVxuXG59Il19
