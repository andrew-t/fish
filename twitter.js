const Fish = require('./fish.js'),
	Twitter = require('twit'),
	fs = require('fs'),
	t = new Twitter(JSON.parse(fs.readFileSync(__dirname + '/creds.json')));

// Debug Twitter Client:
// t = { post:function(u,p,c){ console.log(p.status); c(); }};

(async function() {
	try {
		const { getFact } = await Fish();
		console.log('Initialised');
		console.log('Hmmmm, let me see...');
		const fact = getFact();
		console.log('I have decided that: ' + fact);
		console.log('Length = ' + fact.length);
		if (fact.length <= 280)
			t.post('statuses/update', { status: fact }, err => {
				if (err) console.error('Error: ', err.stack);
			});
		else {
			const factLines = [];
			while (fact.length > 270) {
				let didIt = false;
				for (let i = 269; i > 0 && !didIt; --i)
					if (fact[i] == ' ') {
						didIt = true;
						break;
					}
				if (!didIt) i = 269;
				factLines.push(fact.substr(0, i));
				fact = fact.substr(i + 1);
			}
			factLines.push(fact);
			console.log('Tweets: \n' + factLines.join('\n'));
			fact = factLines.map((f, i) =>
				f + ' (' + (i + 1) + '/' + factLines.length + ')');

			function tweet(replyTo) {
				const status = fact.shift();
				console.log('Tweeting ' + status);
				t.post('statuses/update', replyTo
					? {
						status: status,
						in_reply_to_status_id: replyTo
					} : {
						status: status
					}, (err, data, response) => {
						console.error('Error: ', err.stack);
						console.dir(data);
						if (fact.length) tweet(data.id_str);
					});
			}

			tweet();
		}
	} catch (e) {
		console.error('Error: ', e.stack);
	}
})();
