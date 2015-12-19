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