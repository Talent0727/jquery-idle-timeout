# jQuery Idle Timeout

See the original [Mint.com example](http://www.erichynds.com/examples/jquery-idle-timeout/example-mint.htm), or a [demo](http://www.erichynds.com/examples/jquery-idle-timeout/example-dialog.htm) using jQuery UI's dialog widget.

This script allows you to detect when a user becomes idle (detection provided by Paul Irish's idletimer plugin) and notify the user his/her session
is about to expire.  Similar to the technique seen on Mint.com.  Polling requests are automatically sent to the server at a configurable
interval, maintaining the users session while s/he is using your application for long periods of time.

![Example](http://www.erichynds.com/examples/jquery-idle-timeout/screenshot.gif)

## Changes

* Added an onSuccess callback
* Changed the keepAliveUrl to return json
* Exposed many of the private timer methods
* Now checks your server session to find out when the last in-browser activity was; good if your users open multiple tabs.

Example Setup:

	$.idleTimeout('#dialog', 'div.ui-dialog-buttonpane button:first', {
		idleAfter: 5,
		pollingInterval: 2,
		keepAliveURL: 'keepalive.php',
		serverResponseEquals: 'OK',
		onTimeout: function(){
			window.location = "timeout.htm";
		},
		onIdle: function(){
			$(this).dialog("open");
		},
		onCountdown: function(counter){
			$countdown.html(counter); // update the counter
		},
		onSucess: function(response){
			// Do whatever with response
		}
	});
