var _        = require('lodash'),
    utils    = require('./modules/utils.js'),
    Kasiski  = require('./modules/Kasiski.js'),
    Friedman = require('./modules/Friedman.js');

var log = utils.log;

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
        settings = _.assign({}, defaultSettings, options);

        log('Welcome to Vigenere Decipher Engine BETA 0.1');

        settings.elements.start.addEventListener('click', start);
    }

    function start() {
        log('Starting to decipher', true);

        cipherText = utils.normalize(settings.elements.input.value);

        Kasiski.guessKeyLength(cipherText, settings.minLength, settings.maxLength)
            .then(function(lengths) {
                var length;
                try {
                    length = Friedman.findBestKeyLength(cipherText, lengths);
                } catch(e) {
                    throw new Error(e);
                }
                end(length);
            });
    }

    function end(result) {
        log(result);
        log('Finished step 2', true);
    }

}());



