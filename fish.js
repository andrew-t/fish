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

async function episodeList() {
	const dom = await getDom('https://nstaaf.fandom.com/wiki/List_of_Episodes_of_No_Such_Thing_As_A_Fish');
	const eps = [];
	dom.find('.mw-parser-output #toc ~ ul a')
		.each((i, n) => {
			const url = $(n).attr('href');
			if (url && url[0] == '/')
				eps.push('https://nstaaf.fandom.com' + url);
			else console.log('Skipping blank link:', $(n).text());
		});
	return eps;
}

async function episodeFacts(url) {
	const dom = await getDom(url);
	const facts = [];
	dom.find('#Facts').parent().next('ul').find('li')
		.each((i, n) => facts.push(clean($(n).text())));
	return facts;
}

function sanitise(fact) {
	return fact.toLowerCase().replace(/[^a-z]/g, '').trim();
}

function clean(fact) {
	return fact.trim().replace(/\s+\([^\(]+\)[^a-z]*$|\[\d+\]/ig, '');
}

module.exports = async function Fish(cache, order = 2) {
	let facts,
		sanitisedFacts;
	const then = [],
		m = new Markov(order);
	if (cache) {
		facts = cache;
	} else {
		facts = [];
		for (const ep of await episodeList())
			for (const fact of await episodeFacts(ep))
				facts.push(fact);
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
