var Markov = require('markov'),
	request = require('request'),
	$ = require('cheerio');

module.exports = function Fish(cache) {
	var allFacts,
		sanitisedFacts,
		then = [],
		m = new Markov(2);
	if (cache) {
		allFacts = cache;
		generateMarkov();
	} else
		request({
			uri: 'http://en.wikipedia.org/wiki/No_Such_Thing_as_a_Fish'
		}, function(err, resp, body) {
			allFacts = [];
			$(body).find('td.description')
				.each(function() {
					$(this).text()
						.trim()
						.split(/\n+/)
						.forEach(function(fact) {
							allFacts.push(fact.trim()
								.replace(/\s+\([^\(]+\)[^a-z]*$/i, ''));
						});
				});
			allFacts = allFacts.filter(function(fact) {
				return fact != "This is a special \"Worst Of\" episode, consisting of clips removed from the original podcasts.";
			});
			generateMarkov();
		});
	function sanitise(fact) {
		return fact.toLowerCase().replace(/[^a-z ]/g, '').trim();
	}
	function generateMarkov() {
		sanitisedFacts = allFacts.map(sanitise);
		allFacts.forEach(function(fact) {
			m.seed(fact);
			m.seed(fact.replace(/^[^ ]+ /, ''));
		});
		then.forEach(function(callback) {
			callback(m, allFacts);
		});
	}
	this.then = function(callback) {
		allFacts ? callback(m, allFacts)
			: then.push(callback);
	};
	this.getFact = function() {
		var newFact;
		do {
			var fact = allFacts[Math.floor(Math.random() * allFacts.length)]
					.split(/\W/)
					.filter(function(a) { return a; }),
				seed = fact[0] + ' ' + fact[1],
				key = m.search(seed);
			newFact = (seed + ' ' + m.forward(key, 100).join(' ')).trim();
		} while (~sanitisedFacts.indexOf(sanitise(newFact)) ||
			newFact.split(/ /g).length < 3);
		return newFact;
	};
};
