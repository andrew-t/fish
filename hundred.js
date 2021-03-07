const Fish = require('./fish.js'),
	fs = require('fs'),
	factCount = 100,
	order = parseInt(process.argv[2] || '2', 10);

Fish(fs.existsSync('facts.json') && JSON.parse(fs.readFileSync('facts.json')), order)
	.then(({ getFact, facts }) => {
		fs.writeFileSync('facts.json', JSON.stringify(facts, null, 2));
		for (let i = 0; i < factCount; ++i)
			console.log(i + 1 + '. ' + getFact());
	})
	.catch(err => {
		console.log('Error:');
		console.dir(err);
		process.exit(1);
	});
