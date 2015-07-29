
function fragmentedFor(options)
{
	var fragmentLength, totalLoops, runEachLoop, runWhenDone, start;

	var init = function() {

		fragmentLength = options.fragmentLength || 10;
		totalLoops     = options.totalLoops;
		runEachLoop    = options.runEachLoop;
		runWhenDone    = options.runWhenDone;
		start          = options.start || 0;

		runNextFragment();
	};


	var runNextFragment = function()
	{
		var end = start + fragmentLength;

		for(var $i = $lStart; $i < Math.min(end, getTotal()); $i++) {
			runEachLoop( $i );
		}

		start += fragmentLength;

		if(start < getTotal()) {
			setTimeout(runNextFragment, 1);
		} else { 
			runWhenDone();
		}
	};


	var getTotal = function() {
		// allows totalLoops argument to be either a variable or a function
		return isFunction(totalLoops) ? totalLoops() : totalLoops;
	};


	var isFunction = function(mightBeAFunction)
	{
		return typeof(mightBeAFunction) === 'function';
	};


	var checkIfRequiredArgumentsAreSet = function() {

	};

	init();
} 

/* I still have the feeling I'm doing something horribly wrong */
var fragmentedFor = function($aFragmentLength, $aTotal, $aFunction, $aCallback) 
{
	var $lStart = 0; 
	var getTotal = function()
	{
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

		$lStart += $aFragmentLength;

		if($lStart < getTotal()) {
			setTimeout(forLoop, 1);
		} else { 
			$aCallback();
		}
	})();
};


// shell function to run an asynchronous for-loop, to make sure fragmentedFor does not run ahead of itself when nested
function fragmentedForAsync($aFrom, $aTo, $aFunction, $aCallback) {
    (function loop() {
        if ($aFrom < $aTo)
            $aFunction($aFrom++, loop); // pass itself as callback
        else
            $aCallback();
    })();
}