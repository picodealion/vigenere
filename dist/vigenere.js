(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var vigenere = require('./modules/Vigenere');

vigenere.init();
},{"./modules/Vigenere":7}],2:[function(require,module,exports){
var IC      = require('./IndexOfCoincidence'),
    strings = require('./Strings'),
    utils   = require('./Utils');

function Caesar() {
    'use strict';

    var FREQUENCY_ENGLISH = [0.08167,0.01492,0.02782,0.04253,0.12702,0.02228,0.02015,0.06094,0.06966,0.00153,0.00772,
        0.04025,0.02406,0.06749,0.07507,0.01929,0.00095,0.05987,0.06327,0.09056,0.02758,0.00978,
        0.02360,0.00150,0.01974,0.00074];

    return {
        findShiftLetter: findShiftLetter,
        shiftText: shiftText
    };

    function findShiftLetter(text) {
        var i,
            letter,
            shiftedText,
            shifted = [];

        utils.log('Shifting text to find the text that resembles English most');

        for(i = 0; i < 26; i++) {
            shiftedText = shiftText(text, i);
            shifted.push({
                shift: i,
                text: shiftedText,
                chi: getChiSquared(shiftedText)
            });
        }

        shifted.sort(function(a, b) {
            return a.chi - b.chi;
        });

        letter = String.fromCharCode(shifted[0].shift + 97);

        utils.log("Lowest chi-squared occurs with letter:", letter, "(" + shifted[0].chi + ")");

        return letter;
    }

    function getChiSquared(text) {
        var chiSquared = 0,
            counts = strings.countLetters(text),
            expectedCount,
            i;

            for(i = 0; i < 26; i++) {
                expectedCount =  text.length * FREQUENCY_ENGLISH[i];
                chiSquared += Math.pow((counts[i] - expectedCount), 2) / (expectedCount);
            }

        return chiSquared;
    }

    function shiftText(text, shift) {
        var i,
            newText = '',
            newLetter;

        for(i = 0; i < text.length; i++) {
            newLetter = ((text.charCodeAt(i) - 97) + (26 - shift)) % 26;

            newText += String.fromCharCode(newLetter + 97);
        }

        return newText;
    }
}

module.exports = Caesar();
},{"./IndexOfCoincidence":4,"./Strings":5,"./Utils":6}],3:[function(require,module,exports){
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
        mergeColumns: mergeColumns,
        reduceRepeatedWord: reduceRepeatedWord,
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
            counts[i] = 0;
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

    function mergeColumns(columns) {
        var i,
            j,
            result = '';

        for(i = 0; i < columns[0].length; i++) {
            for(j = 0; j < columns.length; j++) {
                if(columns[j][i]) {
                    result += columns[j][i];
                }
            }
        }

        return result;
    }

    /**
     * @public
     *
     * @param {string} text The text to check for repeated words
     * @returns {string} The repeated words
     *
     * @description
     * Checks if the string consists of one or more exact duplicates of the same word
     * and nothing more, returns that word
     *
     * @examples
     * removeDuplicateWord('testtest');
     * // -> 'test'
     *
     * removeDuplicateWord('testtesta');
     * // -> 'testtesta'
     */
    function reduceRepeatedWord(text) {
        var matches = text.match(/^(\w+)?\1+$/);

        if(matches) {
            text = matches[1];
        }

        return text;
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
var caesar  = require('./CaesarShift'),
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
                key: document.getElementById('key'),
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
            probableKeyLengths,
            solution;

        utils.log('Starting to decipher');
        cipherText = utils.normalize(settings.elements.input.value);

        utils.log('Step 1: Define probable key lengths using Kasiski method');
        probableKeyLengths = guessKeyLengthsKasiski(cipherText, settings.minLength, settings.maxLength);

        utils.log('Step 2: Check best matching key length using Friedman method');
        bestKeyLength = findBestKeyLengthFriedman(cipherText, probableKeyLengths);

        utils.log('Step 3: Perform frequency analyses to decipher key');
        key = getKeyByFrequencyAnalysis(cipherText, bestKeyLength);
        settings.elements.key.innerText = key;

        utils.log('Step 4: Deciphering the cipher text');
        solution = decipherText(cipherText, key);

        end(solution);
    }

    function end(solution) {
        settings.elements.output.innerText = solution;
        utils.log('Finished all steps.');
    }

    function decipherText(text, key) {
        var columns = strings.splitTextIntoColumns(text, key.length),
            i;

        for(i = 0; i < columns.length; i++) {
            columns[i] = caesar.shiftText(columns[i], key.charCodeAt(i) - 97);
        }

        return strings.mergeColumns(columns);
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

        key = strings.reduceRepeatedWord(key);

        utils.log('\nBest guess for the key:', key, "\n\n");

        return key;
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
},{"./CaesarShift":2,"./GreatestCommonDenominator":3,"./IndexOfCoincidence":4,"./Strings":5,"./Utils":6}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL2Zha2VfYjNiMzkyMzUuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvQ2Flc2FyU2hpZnQuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvR3JlYXRlc3RDb21tb25EZW5vbWluYXRvci5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9JbmRleE9mQ29pbmNpZGVuY2UuanMiLCIvVXNlcnMvU3RlcGhhbi9EZXYvdmlnZW5lcmUvc3JjL2pzL21vZHVsZXMvU3RyaW5ncy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9VdGlscy5qcyIsIi9Vc2Vycy9TdGVwaGFuL0Rldi92aWdlbmVyZS9zcmMvanMvbW9kdWxlcy9WaWdlbmVyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHZpZ2VuZXJlID0gcmVxdWlyZSgnLi9tb2R1bGVzL1ZpZ2VuZXJlJyk7XG5cbnZpZ2VuZXJlLmluaXQoKTsiLCJ2YXIgSUMgICAgICA9IHJlcXVpcmUoJy4vSW5kZXhPZkNvaW5jaWRlbmNlJyksXG4gICAgc3RyaW5ncyA9IHJlcXVpcmUoJy4vU3RyaW5ncycpLFxuICAgIHV0aWxzICAgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbmZ1bmN0aW9uIENhZXNhcigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRlJFUVVFTkNZX0VOR0xJU0ggPSBbMC4wODE2NywwLjAxNDkyLDAuMDI3ODIsMC4wNDI1MywwLjEyNzAyLDAuMDIyMjgsMC4wMjAxNSwwLjA2MDk0LDAuMDY5NjYsMC4wMDE1MywwLjAwNzcyLFxuICAgICAgICAwLjA0MDI1LDAuMDI0MDYsMC4wNjc0OSwwLjA3NTA3LDAuMDE5MjksMC4wMDA5NSwwLjA1OTg3LDAuMDYzMjcsMC4wOTA1NiwwLjAyNzU4LDAuMDA5NzgsXG4gICAgICAgIDAuMDIzNjAsMC4wMDE1MCwwLjAxOTc0LDAuMDAwNzRdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZFNoaWZ0TGV0dGVyOiBmaW5kU2hpZnRMZXR0ZXIsXG4gICAgICAgIHNoaWZ0VGV4dDogc2hpZnRUZXh0XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGZpbmRTaGlmdExldHRlcih0ZXh0KSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgbGV0dGVyLFxuICAgICAgICAgICAgc2hpZnRlZFRleHQsXG4gICAgICAgICAgICBzaGlmdGVkID0gW107XG5cbiAgICAgICAgdXRpbHMubG9nKCdTaGlmdGluZyB0ZXh0IHRvIGZpbmQgdGhlIHRleHQgdGhhdCByZXNlbWJsZXMgRW5nbGlzaCBtb3N0Jyk7XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgMjY7IGkrKykge1xuICAgICAgICAgICAgc2hpZnRlZFRleHQgPSBzaGlmdFRleHQodGV4dCwgaSk7XG4gICAgICAgICAgICBzaGlmdGVkLnB1c2goe1xuICAgICAgICAgICAgICAgIHNoaWZ0OiBpLFxuICAgICAgICAgICAgICAgIHRleHQ6IHNoaWZ0ZWRUZXh0LFxuICAgICAgICAgICAgICAgIGNoaTogZ2V0Q2hpU3F1YXJlZChzaGlmdGVkVGV4dClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgc2hpZnRlZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLmNoaSAtIGIuY2hpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXR0ZXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHNoaWZ0ZWRbMF0uc2hpZnQgKyA5Nyk7XG5cbiAgICAgICAgdXRpbHMubG9nKFwiTG93ZXN0IGNoaS1zcXVhcmVkIG9jY3VycyB3aXRoIGxldHRlcjpcIiwgbGV0dGVyLCBcIihcIiArIHNoaWZ0ZWRbMF0uY2hpICsgXCIpXCIpO1xuXG4gICAgICAgIHJldHVybiBsZXR0ZXI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2hpU3F1YXJlZCh0ZXh0KSB7XG4gICAgICAgIHZhciBjaGlTcXVhcmVkID0gMCxcbiAgICAgICAgICAgIGNvdW50cyA9IHN0cmluZ3MuY291bnRMZXR0ZXJzKHRleHQpLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb3VudCxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IDI2OyBpKyspIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZENvdW50ID0gIHRleHQubGVuZ3RoICogRlJFUVVFTkNZX0VOR0xJU0hbaV07XG4gICAgICAgICAgICAgICAgY2hpU3F1YXJlZCArPSBNYXRoLnBvdygoY291bnRzW2ldIC0gZXhwZWN0ZWRDb3VudCksIDIpIC8gKGV4cGVjdGVkQ291bnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGlTcXVhcmVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoaWZ0VGV4dCh0ZXh0LCBzaGlmdCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIG5ld1RleHQgPSAnJyxcbiAgICAgICAgICAgIG5ld0xldHRlcjtcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuZXdMZXR0ZXIgPSAoKHRleHQuY2hhckNvZGVBdChpKSAtIDk3KSArICgyNiAtIHNoaWZ0KSkgJSAyNjtcblxuICAgICAgICAgICAgbmV3VGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG5ld0xldHRlciArIDk3KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXdUZXh0O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDYWVzYXIoKTsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbmZ1bmN0aW9uIEdDRCgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRGYWN0b3JzOiBnZXRGYWN0b3JzLFxuICAgICAgICBnZXRHQ0RzOiBnZXRHQ0RzXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdldEZhY3RvcnMobnVtYmVyLCBtaW4pIHtcbiAgICAgICAgdmFyIGZhY3RvcnMgPSBbXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgZm9yKGkgPSBtaW47IGkgPCBNYXRoLmZsb29yKG51bWJlciAvIDIpOyBpKyspIHtcbiAgICAgICAgICAgIGlmKG51bWJlciAlIGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmYWN0b3JzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFjdG9ycztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRHQ0RzKG51bWJlcnMpIHtcbiAgICAgICAgdmFyIGZhY3RvckNvdW50LFxuICAgICAgICAgICAgZmFjdG9ycyxcbiAgICAgICAgICAgIEdDRHM7XG5cbiAgICAgICAgZmFjdG9ycyA9IG51bWJlcnMucmVkdWNlKGZ1bmN0aW9uKGFsbCwgY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbC5jb25jYXQoZ2V0RmFjdG9ycyhjdXJyZW50LCAzKSk7XG4gICAgICAgIH0sIFtdKTtcblxuICAgICAgICBmYWN0b3JDb3VudCA9IGZhY3RvcnMucmVkdWNlKGZ1bmN0aW9uKGNvdW50ZWQsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNvdW50ZWRbY3VycmVudF0gPSArK2NvdW50ZWRbY3VycmVudF0gfHwgMTtcbiAgICAgICAgICAgIHJldHVybiBjb3VudGVkO1xuICAgICAgICB9LCB7fSk7XG5cbiAgICAgICAgR0NEcyA9IGZhY3RvcnMuZmlsdGVyKHV0aWxzLnVuaXF1ZUZpbHRlcikuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yQ291bnRbYl0gLSBmYWN0b3JDb3VudFthXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHMuc2xpY2UoMCwgMyk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdDRCgpOyIsInZhciBzdHJpbmdzID0gcmVxdWlyZSgnLi9TdHJpbmdzJyksXG4gICAgdXRpbHMgICA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuZnVuY3Rpb24gSUMoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIElDX0VOR0xJU0ggPSAxLjczO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2FsY3VsYXRlSUM6IGNhbGN1bGF0ZUlDLFxuICAgICAgICBjYWxjdWxhdGVJQ0ZvcktleUxlbmd0aHM6IGNhbGN1bGF0ZUlDRm9yS2V5TGVuZ3RocyxcbiAgICAgICAgZ2V0SUNGb3JLZXlMZW5ndGg6IGdldElDRm9yS2V5TGVuZ3RoLFxuICAgICAgICBzb3J0QnlDbG9zZXN0SUM6IHNvcnRCeUNsb3Nlc3RJQ1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUZXh0IHRvIGNhbGN1bGF0ZSB0aGUgSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yXG4gICAgICogQHJldHVybnMge051bWJlcn0gSUMgSW5kZXggb2YgQ29pbmNpZGVuY2UgZm9yIHRoZSBzdXBwbGllZCB0ZXh0XG4gICAgICpcbiAgICAgKiBTZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSW5kZXhfb2ZfY29pbmNpZGVuY2UjQ2FsY3VsYXRpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVJQyh0ZXh0KSB7XG4gICAgICAgIHZhciBsZXR0ZXJDb3VudHMgPSBzdHJpbmdzLmNvdW50TGV0dGVycyh0ZXh0KSxcbiAgICAgICAgICAgIElDLFxuICAgICAgICAgICAgc3VtO1xuXG4gICAgICAgIHN1bSA9IGxldHRlckNvdW50cy5yZWR1Y2UoZnVuY3Rpb24odG90YWwsIGNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdG90YWwgKyAoY291bnQgLyB0ZXh0Lmxlbmd0aCkgKiAoKGNvdW50IC0gMSkgLyAodGV4dC5sZW5ndGggLSAxKSk7XG4gICAgICAgIH0sIDApO1xuXG4gICAgICAgIElDID0gMjYgKiBzdW07XG5cbiAgICAgICAgcmV0dXJuIElDO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRleHQgdG8gZ2V0IHRoZSBJQ3MgZm9yXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGVuZ3RocyBBbiBhcnJheSBvZiBwb3NzaWJsZSBrZXkgbGVuZ3RocyBmb3IgdGhlIGNpcGhlclxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBjb250YWluaW5nIGEga2V5IGxlbmd0aCBhbmQgaXRzIElDXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2FsY3VsYXRlSUNGb3JLZXlMZW5ndGhzKHRleHQsIGxlbmd0aHMpIHtcbiAgICAgICAgcmV0dXJuIGxlbmd0aHMubWFwKGZ1bmN0aW9uKGtleUxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIElDID0gZ2V0SUNGb3JLZXlMZW5ndGgodGV4dCwga2V5TGVuZ3RoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsga2V5TGVuZ3RoOiBrZXlMZW5ndGgsIElDOiBJQyB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGV4dCB0byBjaGVjayBJQyBmb3JcbiAgICAgKiBAcGFyYW0ge051bWJlcn0ga2V5TGVuZ3RoIEtleSBsZW5ndGggdG8gY2hlY2sgSUMgZm9yXG4gICAgICogQHJldHVybnMgIHtOdW1iZXJ9IElDIFRoZSBJQyBmb3IgdGhlIHNwZWNpZmllZCB0ZXh0IGFuZCBrZXlsZW5ndGhcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIFNwbGl0cyB0aGUgdGV4dCBpbnRvIHJvd3Mgb2YgeCBsZW5ndGggYW5kIGNhbGN1bGF0ZXMgdGhlXG4gICAgICogSUMgb2YgZXZlcnkgY29sdW1uIGl0IHByb2R1Y2VzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SUNGb3JLZXlMZW5ndGgodGV4dCwga2V5TGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb2x1bW5zID0gc3RyaW5ncy5zcGxpdFRleHRJbnRvQ29sdW1ucyh0ZXh0LCBrZXlMZW5ndGgpLFxuICAgICAgICAgICAgSUMsXG4gICAgICAgICAgICBzdW1Db2x1bW5JQ3M7XG5cbiAgICAgICAgc3VtQ29sdW1uSUNzID0gY29sdW1ucy5tYXAoY2FsY3VsYXRlSUMpLnJlZHVjZShmdW5jdGlvbih0b3RhbCwgSUMpIHtcbiAgICAgICAgICAgIHJldHVybiB0b3RhbCArIElDO1xuICAgICAgICB9KTtcblxuICAgICAgICBJQyA9IHN1bUNvbHVtbklDcyAvIGNvbHVtbnMubGVuZ3RoO1xuXG4gICAgICAgIHV0aWxzLmxvZygnSUMgZm9yIGtleSBvZiBsZW5ndGgnLCBrZXlMZW5ndGggKyAnOicsIElDKTtcblxuICAgICAgICByZXR1cm4gSUM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc29ydEJ5Q2xvc2VzdElDKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKGEuSUMgLSBJQ19FTkdMSVNIKSA+IE1hdGguYWJzKGIuSUMgLSBJQ19FTkdMSVNIKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSUMoKTsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbmZ1bmN0aW9uIFN0cmluZ3MoKSB7XG5cbiAgICAvLyBlZXd3d3dcbiAgICB2YXIgdGVtcFRleHQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjb3VudExldHRlcnM6IGNvdW50TGV0dGVycyxcbiAgICAgICAgZ2V0UmVjdXJyaW5nU3RyaW5nczogZ2V0UmVjdXJyaW5nU3RyaW5ncyxcbiAgICAgICAgbWVyZ2VDb2x1bW5zOiBtZXJnZUNvbHVtbnMsXG4gICAgICAgIHJlZHVjZVJlcGVhdGVkV29yZDogcmVkdWNlUmVwZWF0ZWRXb3JkLFxuICAgICAgICByZXBsYWNlV2l0aFNwYWNlczogcmVwbGFjZVdpdGhTcGFjZXMsXG4gICAgICAgIHNwbGl0VGV4dEludG9Db2x1bW5zOiBzcGxpdFRleHRJbnRvQ29sdW1uc1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUZXh0IHRvIGNvdW50IGVhY2ggbGV0dGVyIGluXG4gICAgICogQHJldHVybnMge0FycmF5fSBjb3VudHMgQXJyYXkgd2l0aCB0aGUgZnJlcXVlbmN5IGVhY2ggbGV0dGVyIHdhcyBmb3VuZCBpbiB0aGUgdGV4dFxuICAgICAqXG4gICAgICogQHRvZG86IHJlZmFjdG9yIHRvIGJlIG1vcmUgZmxleGlibGUgYW5kIHdpdGggbW9yZSBlcnJvciBjaGVja2luZ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvdW50TGV0dGVycyh0ZXh0KSB7XG4gICAgICAgIHZhciBjb3VudHMgPSBbXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgMjY7IGkrKykge1xuICAgICAgICAgICAgY291bnRzW2ldID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGFySW5kZXggPSB0ZXh0LmNoYXJDb2RlQXQoaSkgLSA5NztcbiAgICAgICAgICAgIGNvdW50c1tjaGFySW5kZXhdKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY291bnRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFJlY3VycmluZ1N0cmluZ3ModGV4dCwgbWluTGVuZ3RoLCBtYXhMZW5ndGgpIHtcbiAgICAgICAgdmFyIHJlY3VycmluZyA9IFtdO1xuXG4gICAgICAgIHRlbXBUZXh0ID0gdGV4dDtcblxuICAgICAgICBmb3IodmFyIGkgPSBtYXhMZW5ndGg7IGkgPj0gbWluTGVuZ3RoOyBpLS0pIHtcbiAgICAgICAgICAgIHJlY3VycmluZyA9IHJlY3VycmluZy5jb25jYXQoZ2V0UmVjdXJyaW5nU3RyaW5nc09mTGVuZ3RoKGkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHJlY3VycmluZy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgdXRpbHMubG9nKFwiUmVjdXJyaW5nIHN0cmluZ3M6XCIsIHJlY3VycmluZy5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5zdHJpbmc7IH0pKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB1dGlscy5sb2coJ05vIHJlY3VycmluZyBzdHJpbmdzIGZvdW5kIDooJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wVGV4dCA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHJlY3VycmluZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRSZWN1cnJpbmdTdHJpbmdzT2ZMZW5ndGgobGVuZ3RoKSB7XG4gICAgICAgIHV0aWxzLmxvZygnRmluZGluZyByZWN1cnJpbmcgc3RyaW5ncyBvZiBsZW5ndGgnLCBsZW5ndGgpO1xuXG4gICAgICAgIHZhciBjb3VudCxcbiAgICAgICAgICAgIHBvcyA9IDAsXG4gICAgICAgICAgICByZWN1cnJpbmcgPSBbXSxcbiAgICAgICAgICAgIHJlZ2V4cCxcbiAgICAgICAgICAgIHN0cmluZztcblxuICAgICAgICB3aGlsZShwb3MgPCB0ZW1wVGV4dC5sZW5ndGggLSBsZW5ndGgpIHtcbiAgICAgICAgICAgIHN0cmluZyA9IHRlbXBUZXh0LnN1YnN0cihwb3MsIGxlbmd0aCk7XG4gICAgICAgICAgICByZWdleHAgPSBuZXcgUmVnRXhwKHN0cmluZywgJ2cnKTtcbiAgICAgICAgICAgIGNvdW50ID0gdGVtcFRleHQubWF0Y2gocmVnZXhwKS5sZW5ndGg7XG5cbiAgICAgICAgICAgIGlmKCFzdHJpbmcubWF0Y2goJyAnKSAmJiBjb3VudCA+IDEpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coc3RyaW5nLCAnb2NjdXJzJywgY291bnQsICd0aW1lcycpO1xuICAgICAgICAgICAgICAgIHJlY3VycmluZy5wdXNoKGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9zKys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVjdXJyaW5nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0cmluZ1Bvc2l0aW9ucyhzdHJpbmcpIHtcbiAgICAgICAgdmFyIG1hdGNoLFxuICAgICAgICAgICAgcmVnZXhwID0gbmV3IFJlZ0V4cChzdHJpbmcsICdnJyksXG4gICAgICAgICAgICByZXN1bHQgPSB7IHN0cmluZzogc3RyaW5nLCBwb3NpdGlvbnM6IFtdIH07XG5cbiAgICAgICAgd2hpbGUoKG1hdGNoID0gcmVnZXhwLmV4ZWModGVtcFRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzdWx0LnBvc2l0aW9ucy5wdXNoKG1hdGNoLmluZGV4KTtcblxuICAgICAgICAgICAgLy8gcmVwbGFjZSBtYXRjaCB3aXRoIHNwYWNlcyBzbyB3ZSBkb24ndCBnZXQgb3ZlcmxhcHBpbmcgcmVzdWx0c1xuICAgICAgICAgICAgdGVtcFRleHQgPSByZXBsYWNlV2l0aFNwYWNlcyh0ZW1wVGV4dCwgbWF0Y2guaW5kZXgsIG1hdGNoLmluZGV4ICsgc3RyaW5nLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1lcmdlQ29sdW1ucyhjb2x1bW5zKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIHJlc3VsdCA9ICcnO1xuXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGNvbHVtbnNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZvcihqID0gMDsgaiA8IGNvbHVtbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZihjb2x1bW5zW2pdW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjb2x1bW5zW2pdW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gY2hlY2sgZm9yIHJlcGVhdGVkIHdvcmRzXG4gICAgICogQHJldHVybnMge3N0cmluZ30gVGhlIHJlcGVhdGVkIHdvcmRzXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBDaGVja3MgaWYgdGhlIHN0cmluZyBjb25zaXN0cyBvZiBvbmUgb3IgbW9yZSBleGFjdCBkdXBsaWNhdGVzIG9mIHRoZSBzYW1lIHdvcmRcbiAgICAgKiBhbmQgbm90aGluZyBtb3JlLCByZXR1cm5zIHRoYXQgd29yZFxuICAgICAqXG4gICAgICogQGV4YW1wbGVzXG4gICAgICogcmVtb3ZlRHVwbGljYXRlV29yZCgndGVzdHRlc3QnKTtcbiAgICAgKiAvLyAtPiAndGVzdCdcbiAgICAgKlxuICAgICAqIHJlbW92ZUR1cGxpY2F0ZVdvcmQoJ3Rlc3R0ZXN0YScpO1xuICAgICAqIC8vIC0+ICd0ZXN0dGVzdGEnXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVkdWNlUmVwZWF0ZWRXb3JkKHRleHQpIHtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKC9eKFxcdyspP1xcMSskLyk7XG5cbiAgICAgICAgaWYobWF0Y2hlcykge1xuICAgICAgICAgICAgdGV4dCA9IG1hdGNoZXNbMV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlV2l0aFNwYWNlcyh0ZXh0LCBzdGFydCwgZW5kKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgc3BhY2VzID0gJyc7XG5cbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgKGVuZCAtIHN0YXJ0KTsgaSsrKSB7XG4gICAgICAgICAgICBzcGFjZXMgKz0gJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRleHQuc3Vic3RyaW5nKDAsIHN0YXJ0KSArIHNwYWNlcyArIHRleHQuc3Vic3RyaW5nKGVuZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRvIHNwbGl0XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGFtb3VudCBBbW91bnQgb2YgY29sdW1ucyB0byBzcGxpdCB0aGUgdGV4dCBpblxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gY29sdW1ucyBBbiBhcnJheSBvZiBzdHJpbmdzLCBlYWNoIGNvbnNpc3Rpbmcgb2YgZXZlcnlcbiAgICAgKiBudGggbGV0dGVyIGluIHRoZSBjaXBoZXIgKHdoZXJlIG4gcmFuZ2VzIGZyb20gMSB0byB0aGUgc3BlY2lmaWVkIGFtb3VudClcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogR2l2ZW4gYSB0ZXh0IG9mIFwiYWJjZGVmZ2hpamtcIiBhbmQgYW4gYW1vdW50IG9mIDQgY29sdW1ucywgd2lsbCBwcm9kdWNlOlxuICAgICAqXG4gICAgICogICAgYSBiIGMgZFxuICAgICAqICAgIGUgZiBnIGhcbiAgICAgKiAgICBpIGoga1xuICAgICAqXG4gICAgICogVGhlIHJldHVybmVkIGNvbHVtbnMgYXJlIHRoZW4gWydhZWknLCAnYmZqJywgJ2NnaycsICdkaCddXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3BsaXRUZXh0SW50b0NvbHVtbnModGV4dCwgYW1vdW50KSB7XG4gICAgICAgIHZhciBjb2x1bW5zID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgb2Zmc2V0ID0gMDsgb2Zmc2V0IDwgYW1vdW50OyBvZmZzZXQrKykge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gb2Zmc2V0LFxuICAgICAgICAgICAgICAgIGNvbHVtbiA9ICcnO1xuXG4gICAgICAgICAgICB3aGlsZSh0ZXh0W2luZGV4XSkge1xuICAgICAgICAgICAgICAgIGNvbHVtbiArPSB0ZXh0W2luZGV4XTtcbiAgICAgICAgICAgICAgICBpbmRleCArPSBhbW91bnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbHVtbnMucHVzaChjb2x1bW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbHVtbnM7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ3MoKTsiLCJmdW5jdGlvbiBVdGlscygpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGFwcGx5U2V0dGluZ3M6IGFwcGx5U2V0dGluZ3MsXG4gICAgICAgIGdldERpc3RhbmNlczogZ2V0RGlzdGFuY2VzLFxuICAgICAgICBsb2c6IGxvZyxcbiAgICAgICAgbm9ybWFsaXplOiBub3JtYWxpemUsXG4gICAgICAgIHVuaXF1ZUZpbHRlcjogdW5pcXVlRmlsdGVyXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFwcGx5U2V0dGluZ3MoZGVmYXVsdHMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgZm9yKGkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGRlZmF1bHRzW2ldID0gb3B0aW9uc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXREaXN0YW5jZXMocmVjdXJyaW5nU3RyaW5ncykge1xuICAgICAgICB2YXIgYWxsRGlzdGFuY2VzLFxuICAgICAgICAgICAgY3VycmVudERpc3RhbmNlcyxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgbG9nKCdEaXN0YW5jZXMgYmV0d2VlbiByZWN1cnJpbmcgc3RyaW5nczonKTtcblxuICAgICAgICBhbGxEaXN0YW5jZXMgPSByZWN1cnJpbmdTdHJpbmdzLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBjdXJyZW50RGlzdGFuY2VzID0gW107XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpdGVtLnBvc2l0aW9ucy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50RGlzdGFuY2VzLnB1c2goaXRlbS5wb3NpdGlvbnNbaSArIDFdIC0gaXRlbS5wb3NpdGlvbnNbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudERpc3RhbmNlcztcbiAgICAgICAgfSkucmVkdWNlKGZ1bmN0aW9uKGFsbCwgY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbC5jb25jYXQoY3VycmVudCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxvZyhhbGxEaXN0YW5jZXMpO1xuXG4gICAgICAgIHJldHVybiBhbGxEaXN0YW5jZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9nKClcbiAgICB7XG4gICAgICAgIHZhciBsb2dFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZycpLFxuICAgICAgICAgICAgbG9nbGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgICAgIG91dHB1dCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykuam9pbignICcpO1xuXG4gICAgICAgIGxvZ2xpbmUuaW5uZXJUZXh0ID0gb3V0cHV0O1xuICAgICAgICBsb2dsaW5lLmNsYXNzTmFtZSA9IFwibG9nbGluZVwiO1xuXG4gICAgICAgIGxvZ0VsZW1lbnQuYXBwZW5kQ2hpbGQobG9nbGluZSk7XG4gICAgICAgIGxvZ0VsZW1lbnQuc2Nyb2xsVG9wID0gbG9nRWxlbWVudC5zY3JvbGxIZWlnaHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplKGlucHV0KVxuICAgIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXpdL2csICcnKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIHVuaXF1ZUZpbHRlcihpdGVtLCBpbmRleCwgc2VsZikge1xuICAgICAgICByZXR1cm4gaW5kZXggPT09IHNlbGYuaW5kZXhPZihpdGVtKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbHMoKTsiLCJ2YXIgY2Flc2FyICA9IHJlcXVpcmUoJy4vQ2Flc2FyU2hpZnQnKSxcbiAgICBHQ0QgICAgID0gcmVxdWlyZSgnLi9HcmVhdGVzdENvbW1vbkRlbm9taW5hdG9yJyksXG4gICAgSUMgICAgICA9IHJlcXVpcmUoJy4vSW5kZXhPZkNvaW5jaWRlbmNlJyksXG4gICAgc3RyaW5ncyA9IHJlcXVpcmUoJy4vU3RyaW5ncycpLFxuICAgIHV0aWxzICAgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmlnZW5lcmUoKTtcblxuZnVuY3Rpb24gVmlnZW5lcmUoKSB7XG4gICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMyxcbiAgICAgICAgICAgIG1heExlbmd0aDogMTIsXG4gICAgICAgICAgICBlbGVtZW50czoge1xuICAgICAgICAgICAgICAgIGlucHV0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lwaGVydGV4dCcpLFxuICAgICAgICAgICAgICAgIG91dHB1dDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYWludGV4dCcpLFxuICAgICAgICAgICAgICAgIGtleTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2tleScpLFxuICAgICAgICAgICAgICAgIGxvZzogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZycpLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVjaXBoZXInKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXR0aW5ncztcblxuICAgIHJldHVybiB7XG4gICAgICAgIGluaXQ6IGluaXRcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaW5pdChvcHRpb25zKSB7XG4gICAgICAgIHV0aWxzLmxvZygnV2VsY29tZSB0byBWaWdlbmVyZSBEZWNpcGhlciBFbmdpbmUgQkVUQSAwLjEnKTtcblxuICAgICAgICBzZXR0aW5ncyA9IHV0aWxzLmFwcGx5U2V0dGluZ3MoZGVmYXVsdFNldHRpbmdzLCBvcHRpb25zKTtcblxuICAgICAgICBzZXR0aW5ncy5lbGVtZW50cy5zdGFydC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN0YXJ0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgdmFyIGJlc3RLZXlMZW5ndGgsXG4gICAgICAgICAgICBjaXBoZXJUZXh0LFxuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgcHJvYmFibGVLZXlMZW5ndGhzLFxuICAgICAgICAgICAgc29sdXRpb247XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGFydGluZyB0byBkZWNpcGhlcicpO1xuICAgICAgICBjaXBoZXJUZXh0ID0gdXRpbHMubm9ybWFsaXplKHNldHRpbmdzLmVsZW1lbnRzLmlucHV0LnZhbHVlKTtcblxuICAgICAgICB1dGlscy5sb2coJ1N0ZXAgMTogRGVmaW5lIHByb2JhYmxlIGtleSBsZW5ndGhzIHVzaW5nIEthc2lza2kgbWV0aG9kJyk7XG4gICAgICAgIHByb2JhYmxlS2V5TGVuZ3RocyA9IGd1ZXNzS2V5TGVuZ3Roc0thc2lza2koY2lwaGVyVGV4dCwgc2V0dGluZ3MubWluTGVuZ3RoLCBzZXR0aW5ncy5tYXhMZW5ndGgpO1xuXG4gICAgICAgIHV0aWxzLmxvZygnU3RlcCAyOiBDaGVjayBiZXN0IG1hdGNoaW5nIGtleSBsZW5ndGggdXNpbmcgRnJpZWRtYW4gbWV0aG9kJyk7XG4gICAgICAgIGJlc3RLZXlMZW5ndGggPSBmaW5kQmVzdEtleUxlbmd0aEZyaWVkbWFuKGNpcGhlclRleHQsIHByb2JhYmxlS2V5TGVuZ3Rocyk7XG5cbiAgICAgICAgdXRpbHMubG9nKCdTdGVwIDM6IFBlcmZvcm0gZnJlcXVlbmN5IGFuYWx5c2VzIHRvIGRlY2lwaGVyIGtleScpO1xuICAgICAgICBrZXkgPSBnZXRLZXlCeUZyZXF1ZW5jeUFuYWx5c2lzKGNpcGhlclRleHQsIGJlc3RLZXlMZW5ndGgpO1xuICAgICAgICBzZXR0aW5ncy5lbGVtZW50cy5rZXkuaW5uZXJUZXh0ID0ga2V5O1xuXG4gICAgICAgIHV0aWxzLmxvZygnU3RlcCA0OiBEZWNpcGhlcmluZyB0aGUgY2lwaGVyIHRleHQnKTtcbiAgICAgICAgc29sdXRpb24gPSBkZWNpcGhlclRleHQoY2lwaGVyVGV4dCwga2V5KTtcblxuICAgICAgICBlbmQoc29sdXRpb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuZChzb2x1dGlvbikge1xuICAgICAgICBzZXR0aW5ncy5lbGVtZW50cy5vdXRwdXQuaW5uZXJUZXh0ID0gc29sdXRpb247XG4gICAgICAgIHV0aWxzLmxvZygnRmluaXNoZWQgYWxsIHN0ZXBzLicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlY2lwaGVyVGV4dCh0ZXh0LCBrZXkpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSBzdHJpbmdzLnNwbGl0VGV4dEludG9Db2x1bW5zKHRleHQsIGtleS5sZW5ndGgpLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb2x1bW5zW2ldID0gY2Flc2FyLnNoaWZ0VGV4dChjb2x1bW5zW2ldLCBrZXkuY2hhckNvZGVBdChpKSAtIDk3KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdHJpbmdzLm1lcmdlQ29sdW1ucyhjb2x1bW5zKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kQmVzdEtleUxlbmd0aEZyaWVkbWFuKGNpcGhlclRleHQsIGxlbmd0aHMpIHtcbiAgICAgICAgdmFyIGJlc3RNYXRjaCxcbiAgICAgICAgICAgIElDcztcblxuICAgICAgICB1dGlscy5sb2coJ0NoZWNraW5nIG1vc3QgcHJvYmFibGUga2V5IGxlbmd0aCcpO1xuXG4gICAgICAgIElDcyA9IElDLmNhbGN1bGF0ZUlDRm9yS2V5TGVuZ3RocyhjaXBoZXJUZXh0LCBsZW5ndGhzKTtcbiAgICAgICAgYmVzdE1hdGNoID0gSUNzLnNvcnQoSUMuc29ydEJ5Q2xvc2VzdElDKVswXTtcblxuICAgICAgICB1dGlscy5sb2coJ0Jlc3QgZ3Vlc3MgZm9yIGtleSBsZW5ndGg6JywgYmVzdE1hdGNoLmtleUxlbmd0aCk7XG5cbiAgICAgICAgcmV0dXJuIGJlc3RNYXRjaC5rZXlMZW5ndGg7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0S2V5QnlGcmVxdWVuY3lBbmFseXNpcyhjaXBoZXJUZXh0LCBrZXlMZW5ndGgpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAga2V5ID0gJyc7XG5cbiAgICAgICAgY29sdW1ucyA9IHN0cmluZ3Muc3BsaXRUZXh0SW50b0NvbHVtbnMoY2lwaGVyVGV4dCwga2V5TGVuZ3RoKTtcblxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBrZXlMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdXRpbHMubG9nKCdGaW5kaW5nIGtleSBsZXR0ZXInLCBpKzEsICdvZicsIGtleUxlbmd0aCk7XG4gICAgICAgICAgICBrZXkgKz0gY2Flc2FyLmZpbmRTaGlmdExldHRlcihjb2x1bW5zW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGtleSA9IHN0cmluZ3MucmVkdWNlUmVwZWF0ZWRXb3JkKGtleSk7XG5cbiAgICAgICAgdXRpbHMubG9nKCdcXG5CZXN0IGd1ZXNzIGZvciB0aGUga2V5OicsIGtleSwgXCJcXG5cXG5cIik7XG5cbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBndWVzc0tleUxlbmd0aHNLYXNpc2tpKGNpcGhlclRleHQsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHZhciBkaXN0YW5jZXMsXG4gICAgICAgICAgICBHQ0RzLFxuICAgICAgICAgICAgcmVjdXJyaW5nU3RyaW5ncztcblxuICAgICAgICByZWN1cnJpbmdTdHJpbmdzID0gc3RyaW5ncy5nZXRSZWN1cnJpbmdTdHJpbmdzKGNpcGhlclRleHQsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoKTtcbiAgICAgICAgZGlzdGFuY2VzID0gdXRpbHMuZ2V0RGlzdGFuY2VzKHJlY3VycmluZ1N0cmluZ3MpO1xuICAgICAgICBHQ0RzID0gR0NELmdldEdDRHMoZGlzdGFuY2VzKTtcblxuICAgICAgICB1dGlscy5sb2coJ01vc3QgcHJvYmFibGUga2V5IGxlbmd0aHM6JywgR0NEcyk7XG5cbiAgICAgICAgcmV0dXJuIEdDRHM7XG4gICAgfVxuXG59Il19
