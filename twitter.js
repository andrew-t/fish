var Fish = require('./fish.js'),
	Twitter = require('twit'),
	fs = require('fs'),
	t = new Twitter(JSON.parse(fs.readFileSync('creds.json'))), /*
	t = { post:function(u,p,c){ console.log(p.status); c(); }}, //*/
	fish;

refresh();
setInterval(refresh, 1000 * 60 * 60 * 24);
function refresh() {
	fish = new Fish();
	fish.then(function() {
		console.log('Initialised');
	});
}

tweetAFact();
setInterval(tweetAFact, 1000 * 60 * 60 * 3);
function tweetAFact() {
	fish.then(function() {
		var fact = fish.getFact();
		if (fact.length <= 140)
			t.post('statuses/update', {
				status: fact
			}, logError);
		else {
			var factLines = [];
			while (fact.length > 130) {
				var didIt = false;
				for (var i = 129; i > 0 && !didIt; --i)
					if (fact[i] == ' ') {
						didIt = true;
						break;
					}
				if (!didIt)
					i = 129;
				factLines.push(fact.substr(0, i));
				fact = fact.substr(i + 1);
			}
			factLines.push(fact);
			fact = factLines.map(function(f, i) {
				return f + ' (' + (i + 1) + '/' + factList.length + ')';
			});
			function tweet(replyTo) {
				var status = fact.shift();
				t.post('statuses/update', replyTo
					? {
						status: status,
						in_reply_to_status_id: replyTo
					} : {
						status: status
					}, function(err, data, response) {
						logError(err);
						console.dir(data);
						if (fact.length)
							tweet(data.id_str);
					});
			}
			tweet();
		}
	}).catch(logError);
}

function logError(err) {
	if (err) {
		console.log('Error:');
		console.dir(err);
	}
}
