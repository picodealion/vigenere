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