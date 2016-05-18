/*
 * jQuery Idle Timeout 1.2
 * Copyright (c) 2011 Eric Hynds
 *
 * http://www.erichynds.com/jquery/a-new-and-improved-jquery-idle-timeout-plugin/
 *
 * Depends:
 *  - jQuery 1.4.2+
 *  - jQuery Idle Timer (by Paul Irish, http://paulirish.com/2009/jquery-idletimer-plugin/)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

(function($, win){

	var idleTimeout = {
		init: function( element, resume, options ){
			var self = this, elem, visProp = this._getHiddenProp();

			this.warning = elem = $(element);
			this.resume = $(resume);
			this.options = options;
			this.countdownOpen = false;
			this.failedRequests = options.failedRequests;
			this._startTimer();
			this.title = document.title;
			this.focused = true;

			// expose obj to data cache so peeps can call internal methods
			$.data( elem[0], 'idletimeout', this );

			// start the idle timer
			$(document).idleTimer({newTimeout: options.idleAfter * 1000});

			// once the user becomes idle
			$(document).bind("idle.idleTimer", function(){

				// if the user is idle and a countdown isn't already running
				if( $.data(document, 'idleTimer') === 'idle' && !self.countdownOpen ){
					self._stopTimer();
					self.countdownOpen = true;
					self._idle();
				}
			});

			// bind continue link
			this.resume.bind("click", function(e){
				e.preventDefault();
				self._resume();
			});

			// don't constantly change the title if the window does not have focus
			// http://www.html5rocks.com/en/tutorials/pagevisibility/intro/
			if (visProp) {
				var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
				document.addEventListener(evtname, function() {
					if (self._isHidden()) {
						self.focused = false;
					}
					else {
						self.focused = true;
					}
				});
			}
		},

		// We need to expose the resume method in order to fire it in inactive windows.
		_resume: function() {
			var self = this, options = this.options;

			win.clearInterval(self.countdown); // stop the countdown
			self.countdownOpen = false; // stop countdown
			self._startTimer(); // start up the timer again
			self._keepAlive( false ); // ping server
			document.title = self.title;
			options.onResume.call( self.warning ); // call the resume callback
		},

		_idle: function(){
			var self = this,
				options = this.options,
				warning = this.warning[0],
				counter = options.warningLength;

			// fire the onIdle function
			options.onIdle.call(warning);

			// set inital value in the countdown placeholder
			options.onCountdown.call(warning, counter);

			// create a timer that runs every second
			this.countdown = win.setInterval(function(){
				if(--counter === 0){
					window.clearInterval(self.countdown);
					options.onTimeout.call(warning);
				} else {
					options.onCountdown.call(warning, counter);
					// Only change the window title if we have focus to prevent a bug with Chrome not updating on resume properly
					if (self.focused) {
						document.title = options.titleMessage.replace('%s', counter) + self.title;
					}
					else {
						document.title = self.title;
					}
				}
			}, 1000);
		},

		_startTimer: function(){
			var self = this;

			this.timer = win.setTimeout(function(){
				self._keepAlive();
			}, this.options.pollingInterval * 1000);
		},

		_stopTimer: function(){
			// reset the failed requests counter
			this.failedRequests = this.options.failedRequests;
			win.clearTimeout(this.timer);
		},

		_keepAlive: function( recurse ){
			var self = this,
				options = this.options,
				warning = this.warning[0];

			//Reset the title to what it was.
			document.title = self.title;

			// assume a startTimer/keepAlive loop unless told otherwise
			if( typeof recurse === "undefined" ){
				recurse = true;
			}

			// if too many requests failed, abort
			if( !this.failedRequests ){
				this._stopTimer();
				options.onAbort.call(warning);
				return;
			}

			$.ajax({
				timeout: options.AJAXTimeout,
				url: options.keepAliveURL + '?lastActive=' + $(document).idleTimer('getTimes')['start']
										  + '&page=' + encodeURIComponent(window.location.pathname),
				dataType: "json",
				error: function(xhr){
					self.failedRequests--;
					// Log out on a 401 status
					if (xhr.status === 401) {
						self._stopTimer();
						options.onTimeout.call(warning);
						return;
					}
				},
				success: function(response){
					var lastActive = parseInt(response.lastActive);
					if($.trim(response.msg) !== options.serverResponseEquals){
						self.failedRequests--;
					} else {
						if(self._is_int(lastActive) && lastActive > $(document).idleTimer('getTimes')['start']) {
							$(document).idleTimer('handleUserEvent', lastActive);
						}
						options.onSuccess.call( undefined, response );
					}
				},
				complete: function(){
					if( recurse ){
						self._startTimer();
					}
				}
			});
		},

		_is_int: function(mixed_var) { //http://phpjs.org/functions/is_int/
			return mixed_var === +mixed_var && isFinite(mixed_var) && !(mixed_var % 1);
		},

		_getHiddenProp: function() {
			var prefixes = ['webkit','moz','ms','o'];

			// if 'hidden' is natively supported just return it
			if ('hidden' in document) return 'hidden';

			// otherwise loop over all the known prefixes until we find one
			for (var i = 0; i < prefixes.length; i++){
				if ((prefixes[i] + 'Hidden') in document) {
					return prefixes[i] + 'Hidden';
				}
			}

			// otherwise it's not supported
			return null;
		},

		_isHidden: function() {
			var self = this;
			var prop = self._getHiddenProp();
			if (!prop) {
				return false;
			}
			return document[prop];
		}
	};

	// expose
	$.idleTimeout = function(element, resume, options){
		idleTimeout.init( element, resume, $.extend($.idleTimeout.options, options) );
		return this;
	};

	$.idleTimeout.triggerIdle = function() {
		idleTimeout._idle();
	};

	$.idleTimeout.triggerResume = function () {
		idleTimeout._resume();
	};

	// options
	$.idleTimeout.options = {
		// number of seconds after user is idle to show the warning
		warningLength: 30,

		// url to call to keep the session alive while the user is active
		keepAliveURL: "",

		// the response from keepAliveURL must equal this text:
		serverResponseEquals: "OK",

		// user is considered idle after this many seconds.  10 minutes default
		idleAfter: 600,

		// a polling request will be sent to the server every X seconds
		pollingInterval: 60,

		// number of failed polling requests until we abort this script
		failedRequests: 5,

		// the $.ajax timeout in MILLISECONDS!
		AJAXTimeout: 250,

		// %s will be replaced by the counter value
		titleMessage: 'Warning: %s seconds until log out | ',

		/*
		 Callbacks
		 "this" refers to the element found by the first selector passed to $.idleTimeout.
		 */
		// callback to fire when the session times out
		onTimeout: $.noop,

		// fires when the user becomes idle
		onIdle: $.noop,

		// fires during each second of warningLength
		onCountdown: $.noop,

		// fires when the user resumes the session
		onResume: $.noop,

		// callback to fire when the script is aborted due to too many failed requests
		onAbort: $.noop,

		// An onSuccess callback for when the keepalive is successful.
		onSuccess: $.noop
	};

})(jQuery, window);