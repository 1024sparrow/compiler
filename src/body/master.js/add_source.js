function(p_source){
	const fs = require('fs');
	if (!fs.existsSync('__meta__')){
		//fs.writeFileSync('__meta__', '', 'utf8');
		console.log('There is not __meta__ file');
		process.exit(1);
	}
	var meta = JSON.parse(fs.readFileSync('__meta__', 'utf8'));
}
