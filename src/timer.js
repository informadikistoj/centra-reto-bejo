import * as CRCirkulero from './api/cirkulero';

let timers = [];

/**
 * Sets up the timers
 */
export function init () {
	CR.log.info('Agordas tempeventojn');

	addTimer({
		time: CR.conf.timers.cirkuleroReminders,
		fn: CRCirkulero.checkReminders,
		immediate: true
	});
};

/**
 * Adds a new timer
 * @param {Object}   options
 * @param {number}   options.time        The interval in milliseconds
 * @param {Function} options.fn          The function to run
 * @param {Array}    [options.args]      The args to supply to the function
 * @param {boolean}  [options.immediate] Whether to additionally run the function immediately
 */
function addTimer ({
	time,
	fn,
	args = [],
	immediate = false
} = {}) {
	if (immediate) { fn(...args); }
	const timer = setInterval(fn, time, ...args);
	timers.push(timer);
}

export function getAllTimers () {
	return timers;
}

export function removeAllTimers () {
	for (let timer of timers) {
		clearInterval(timer)
	}
	timers = [];
}
