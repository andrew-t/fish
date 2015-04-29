var Markov = require('markov'),
	http = require('http'),
	$ = require('cheerio');

module.exports = function Fish(cache, order) {
	if (!order)
		order = 2;
	var allFacts,
		sanitisedFacts,
		then = [],
		m = new Markov(order);
	if (cache) {
		allFacts = cache;
		generateMarkov();
	} else
		http.get({
			host: 'en.wikipedia.org',
			path: '/wiki/No_Such_Thing_as_a_Fish'
		}, function(resp) {
			var body = '';
			resp.on('data', function(chunk) { body += chunk; });
			resp.on('end', function() {
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
			}).on('error', function(err) {
				console.log('Error:');
				console.dir(err);
			});
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
			var fact = allFacts[0|(Math.random() * allFacts.length)]
					.split(/\W/)
					.filter(function(a) { return a; }),
				offset = 0|(Math.random() * order),
				seed = fact.slice(offset, order).join(' '),
				key = m.search(seed);
			newFact = (fact.slice(0, offset).join(' ') + ' ' +
				seed +
				' ' + m.forward(key, 100).join(' ')).trim();
		} while (~sanitisedFacts.indexOf(sanitise(newFact)) ||
			newFact.split(/ /g).length <= order);
		return newFact;
	};
};
