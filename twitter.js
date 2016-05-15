var Fish = require('./fish.js'),
	Twitter = require('twit'),
	fs = require('fs'),
	t = new Twitter(JSON.parse(fs.readFileSync('creds.json'))), /*
	t = { post:function(u,p,c){ console.log(p.status); c(); }}, //*/
	fish;
console.log('aaa');

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
			fact = [fact];
			while (fact[fact.length - 1].length > 130) {
				for (var bits = fact.pop().split(' '), last = '';
					bits.length;
					last += (last && ' ') + bits.shift())
					if ((last.length + (bits[0] || '').length) > 129) {
						fact.push(last);
						last = '';
					}
				fact.push(last);
			}
			fact = fact.map(function(f, i) {
				return f + ' (' + (i + 1) + '/' + fact.length + ')';
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
	});
}

function logError(err) {
	if (err) {
		console.log('Error:');
		console.dir(err);
	}
}
