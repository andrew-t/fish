var Fish = require('./fish.js'),
	fs = require('fs'),
	factCount = 100,
	order = parseInt(process.argv[2] || '2', 10);

var fish = new Fish(fs.existsSync('facts.json') &&
			JSON.parse(fs.readFileSync('facts.json')),
		order);
fish.then(function(m, facts) {
	fs.writeFileSync('facts.json', JSON.stringify(facts, null, 2));
	for (var i = 0; i < factCount; ++i)
		console.log(i + 1 + '. ' + fish.getFact());
});