module.exports = {

        getEvertNthChar: function(text, n, offset) {
            var result = '',
                i = offset;

            while(text[i]) {
                result += text[i];
                i += n;
            }

            return result;
        },

        log: function($aOutput, $aNewLine)
        {
            var $lOutput = ( ($aNewLine) ? "\r\n" : '') + $aOutput,
                $log = $('#log');

            $log.append($lOutput).delay(1).scrollTop( $log.prop("scrollHeight") - $log.height() );
        },


        output: function($aText)
        {
            $('#plaintext').html($aText);
        },

        normalize: function($aText)
        {
            $lText = $aText.toLowerCase();
            $lText = $lText.replace(/[^a-z]/gi, '');

            return $lText;
        },


        /* I still have the feeling I'm doing something horribly wrong */
        fragmentedFor: function($aFragmentLength, $aTotal, $aFunction, $aCallback, $aBatchEnd)
        {
            var $lStart = 0;
            var getTotal = function()
            {
                return (typeof($aTotal) === 'function') ? $aTotal() : $aTotal;
            };
            getTotal(); // @TODO: find out why forLoop() bugs out if I don't launch getTotal() here first

            // simulate a for loop, but in fragments to prevent the browser from freezing
            (function forLoop ($aStart)
            {
                // run x loops at a time
                var $lEnd = $lStart + $aFragmentLength;

                for(var $i = $lStart; $i < Math.min($lEnd, getTotal()); $i++) {
                    $aFunction( $i );
                }
                $aBatchEnd();

                $lStart += $aFragmentLength;

                if($lStart < getTotal()) {
                    setTimeout(forLoop, 1);
                } else {
                    $aCallback();
                }
            })();
        },


        // shell function to run an asynchronous for-loop, to make sure fragmentedFor does not run ahead of itself when nested
        fragmentedForAsync: function($aFrom, $aTo, $aFunction, $aCallback) {
            (function loop() {
                if ($aFrom < $aTo)
                    $aFunction($aFrom++, loop); // pass itself as callback
                else
                    $aCallback();
            })();
        },

        objectToArray: function($aObject)
        {
            var $lArray = [];
            $.each($aObject, function($lKey, $lVal){
                if(parseInt($lKey) == $lKey)
                    $lKey = parseInt($lKey);

                $lArray.push([$lKey, $lVal]);
            });
            return $lArray;
        },


        arrayToObject: function($aArray)
        {
            var $lObject = {};
            $.each($aArray, function($lKey, $lVal){
                $lObject[$lVal[0]] = $lVal[1];
            });
            return $lObject;
        },

        sortObjectByValue: function($aObject, $aSortDesc)
        {
            var $lSortDesc = !!$aSortDesc;
            var $lArray = [];

            $.each($aObject, function($lKey, $lVal){
                $lArray.push([$lKey, $lVal]);
            });

            $lArray.sort(function(a, b) {
                return ($lSortDesc) ? b[1] - a[1] : a[1] - b[1];
            });

            return $lArray;
        }
};