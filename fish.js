const Markov = require('markov-fish'),
	https = require('https'),
	$ = require('cheerio');

function getDom(url) {
	return new Promise((resolve, reject) =>
		https.get(url, resp => {
			const body = [];
			resp.on('data', chunk => body.push(chunk));
			resp.on('end', () => resolve($(Buffer.concat(body).toString())));
		}).on('error', reject));
}

function sanitise(fact) {
	return fact.toLowerCase().replace(/[^a-z]/g, '').trim();
}

function clean(fact) {
	return fact.trim().replace(/\s+\([^\(]+\)[^a-z]*$/i, '');
}

module.exports = async function Fish(cache, order = 2) {
	let facts,
		sanitisedFacts;
	const then = [],
		m = new Markov(order);
	if (cache) {
		facts = cache;
	} else {
		const dom = await getDom({
			host: 'github.com',
			path: '/andrew-t/fish/wiki/List-of-No-Such-Thing-as-a-Fish-Episodes'
		});
		facts = [];
		dom.find('#wiki-body li').each((i, n) =>
			facts.push(clean($(n).text())));
		facts = facts.filter(fact => fact != "This is a special \"Worst Of\" episode, consisting of clips removed from the original podcasts.");
	}

	sanitisedFacts = facts.map(sanitise);
	facts.forEach(fact => m.train(fact));
	then.forEach(callback => callback(m, facts));

	function getFact() {
		let newFact;
		do {
			newFact = m.ramble().trim();
		} while (~sanitisedFacts.indexOf(sanitise(newFact)) ||
			newFact.split(/ /g).length <= order);
		return newFact;
	};

	return { m, facts, getFact };
};
