/*
 * jQuery idleTimer plugin
 * version 0.8.092209
 * by Paul Irish.
 *   http://github.com/paulirish/yui-misc/tree/
 * MIT license

 * adapted from YUI idle timer by nzakas:
 *   http://github.com/nzakas/yui-misc/


 * Copyright (c) 2009 Nicholas C. Zakas
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.


 * Major overhaul
 * by Scott Connerly
 * of Fire-Engine-Red.com
 * 2015-09-21
 *
 */

module.exports = (function($){
    //http://stackoverflow.com/a/6871820/218967
    var
        sortaPublicMethods = {
            init : function(options) {
                /**
                 * Starts the idle timer. This adds appropriate event handlers
                 * and starts the first timeout.
                 * @param {int} newTimeout (Optional) A new value for the timeout period in ms.
                 * @return {void}
                 * @method $.idleTimer
                 * @static
                 */
                olddate = +new Date;
                //assign a new timeout if requested
                if (typeof options.newTimeout == "number"){
                    timeout = options.newTimeout;
                }

                //assign appropriate event handlers
                $(document).bind($.trim((events+' ').split(' ').join('.idleTimer ')), function() {
                    $(document).idleTimer('handleUserEvent');
                });

                //set a timeout to toggle state
                $(document).idleTimer('setTimerId', setTimeout(toggleIdleState, timeout));

                // assume the user is active for the first x seconds.
                $.data(document,'idleTimer',"active");
            },
            handleUserEvent : function( newOldDate ) {
                /* Handles a user event indicating that the user isn't idle.
                 * Moved this to be public so we could trigger "events" from other tabs (by way of the server session)
                 * newOldDate is optional
                 */
                //clear any existing timeout
                clearTimeout($(document).idleTimer('getTimerId'));
                $(document).idleTimer('setTimerId',null);

                // Reset timeout counter
                if (newOldDate !== undefined) { //meaning it was passed in, probably from another tab.
                    olddate = newOldDate;
                }
                else {
                    olddate = +new Date;
                }

                //if the idle timer is enabled
                if (enabled) {
                    //if it's idle, that means the user is no longer idle
                    if (idle) {
                        toggleIdleState(newOldDate);
                    }
                    //set a new timeout
                    var msTillTimeout = Math.max(timeout - (new Date - olddate), 0);
                    $(document).idleTimer('setTimerId', setTimeout(toggleIdleState, msTillTimeout, newOldDate));
                }
            },
            getTimes : function() {
                var now = (+new Date);
                return {
                    start: olddate,
                    now: now,
                    elapsed: now - olddate
                }
            },
            setTimerId : function(newTimerId) {
                tId = newTimerId;
            },
            getTimerId : function() {
                return tId;
            }
        },

        idle    = false,        //indicates if the user is idle
        enabled = true,        //indicates if the idle timer is enabled
        timeout = 30000,        //the amount of time (ms) before the user is considered idle
        events  = 'mousemove keydown DOMMouseScroll mousewheel mousedown', // activity is one of these events
        tId     = null,
        olddate = null,
    /*
     * Toggles the idle state and fires an appropriate event.
     * @return {void}
     * private
     */
        toggleIdleState = function(newOldDate){

            //toggle the state
            idle = !idle;

            // reset timeout counter
            if(typeof newOldDate != 'undefined') { //meaning it was passed in, probably from another tab.
                olddate = newOldDate;
            }
            else {
                olddate = +new Date;
            }

            //fire appropriate event
            $(document).trigger(  $.data(document,'idleTimer', idle ? "idle" : "active" )  + '.idleTimer');
        },

        /**
         * Stops the idle timer. This removes appropriate event handlers
         * and cancels any pending timeouts.
         * @return {void}
         * @method stop
         * @static
         * private
         */
        stop = function(){

            //set to disabled
            enabled = false;

            //clear any pending timeouts
            clearTimeout($(document).idleTimer('getTimerId'));
            $(document).idleTimer('setTimerId',null);

            //detach the event handlers
            $(document).unbind('.idleTimer');
        };

    //The only really public method
    $.fn.idleTimer = function(methodOrOptions) {
        if ( sortaPublicMethods[methodOrOptions] ) {
            return sortaPublicMethods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
            // Default to "init"
            return sortaPublicMethods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.idleTimer' );
        }
    };

    // end of $.idleTimer()
})(jQuery);
