// experiment settings
var expt = {
	name: 'signaling_solo',
	maxTrials: 10,
    debug: true,
    rmse_threshold: 0.5,
    rmse_match: 'color',
    saveURL: 'http://experiments.evullab.org/signaling_solo/submit.simple.php',
};


function debugLog(message){
	if(expt.debug){
		console.log(message);
	}
}