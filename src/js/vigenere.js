var _        = require('lodash'),
    utils    = require('./modules/utils.js'),
    Kasiski  = require('./modules/Kasiski.js'),
    Friedman = require('./modules/Friedman.js');

module.exports = (function Vigenere()
{
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

        settings = _.assign({}, defaultSettings, options);

        settings.elements.start.addEventListener('click', start);
    }

    function start() {
        var bestKeyLength,
            probableKeyLengths;

        utils.log('Starting to decipher');

        cipherText = utils.normalize(settings.elements.input.value);

        probableKeyLengths = Kasiski.guessKeyLength(cipherText, settings.minLength, settings.maxLength);
        bestKeyLength = Friedman.findBestKeyLength(cipherText, probableKeyLengths);

        utils.log('Best guess for key lentgh: ', length);

        end(bestKeyLength);
    }

    function end(result) {
        utils.log(result);
        utils.log('Finished step 2');
    }

}());



