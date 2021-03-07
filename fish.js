const Markov = require('markov-fish'),
	https = require('https'),
	$ = require('cheerio');

module.exports = function Fish(cache, order) {
	if (!order)
		order = 2;
	let allFacts,
		sanitisedFacts;
	const then = [],
		m = new Markov(order);
	if (cache) {
		allFacts = cache;
		generateMarkov();
	} else
		https.get({
			host: 'github.com',
			path: '/andrew-t/fish/wiki/List-of-No-Such-Thing-as-a-Fish-Episodes'
		}, resp => {
			let body = '';
			resp.on('data', function(chunk) { body += chunk; });
			resp.on('end', function() {
				allFacts = [];
				$(body).find('#wiki-body li')
					.each(() =>
						allFacts.push($(this).text().trim()
							.replace(/\s+\([^\(]+\)[^a-z]*$/i, '')));
				allFacts = allFacts.filter(fact => fact != "This is a special \"Worst Of\" episode, consisting of clips removed from the original podcasts.");
				generateMarkov();
			}).on('error', err => {
				console.log('Error:');
				console.dir(err);
			});
		});

	function sanitise(fact) {
		return fact.toLowerCase().replace(/[^a-z]/g, '').trim();
	}

	function generateMarkov() {
		sanitisedFacts = allFacts.map(sanitise);
		allFacts.forEach(fact => m.train(fact));
		then.forEach(callback => callback(m, allFacts));
	}

	this.then = callback => allFacts
		? callback(m, allFacts)
		: then.push(callback);

	this.getFact = () => {
		let newFact;
		do {
			newFact = m.ramble().trim();
		} while (~sanitisedFacts.indexOf(sanitise(newFact)) ||
			newFact.split(/ /g).length <= order);
		return newFact;
	};
};
