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