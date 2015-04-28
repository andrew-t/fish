var Fish = require('./fish.js'),
	Twitter = require('twit'),
	fs = require('fs'),
	t = new Twitter(JSON.parse(fs.readFileSync('creds.json'))), /*
	t = { post:function(u,p,c){ console.log(p.status); c(); }}, //*/
	fish;

function refresh() { fish = new Fish(); }
refresh();
setInterval(refresh, 1000 * 60 * 60 * 24);

setInterval(function() {
	fish.then(function() {
		var fact = fish.getFact();
		if (fact.length <= 140)
			t.post('statuses/update', {
				status: fact
			}, function(err, data, response) {});
		else {
			fact = [fact];
			while (fact[fact.length - 1].length > 130) {
				var bits = fact.pop().split(' '),
					last = '';
				while (last.length + bits[0].length < 129)
					last += (last && ' ') + bits.shift();
				fact.push(last);
				fact.push(bits.join(' '));
			}
			fact = fact.map(function(f, i) {
				return f + ' (' + (i + 1) + '/' + fact.length + ')';
			});
			function tweet() {
				t.post('statuses/update', {
					status: fact.shift()
				}, function(err, data, response) {
					if (fact.length) tweet();
				});
			}
			tweet();
		}
	});
}, 1000 * 60 * 60 * 3);