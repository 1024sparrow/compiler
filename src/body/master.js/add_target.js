function(){
	if (!fs.existsSync('__meta__')){
		console.log('File \"__meta__\" not found');
		process.exit(1);
	}
	try{
		var meta = JSON.parse(fs.readFileSync('__meta__', 'utf8'));
	} catch(e) {
		console.log('Файл __meta__ не является корректным JSON-файлом. Операция добавления цели сборки прервана.');
		console.log('Описание ошибки: '+e);
		process.exit(1);
	}
	if (!meta.hasOwnProperty('files')){
		meta.files = [];
	}
	var targetCand = readlineSync.question('Какой файл добавить к списку целей сборки: ');
	if (!targetCand){
		process.exit(1);
	}
	for (const o of meta.files){
		if (o.target === targetCand){
			console.log(`Target "${targetCand}" already exists`);
			process.exit(1);
		}
	}
	for (const oTarget of meta.files){
		if (oTarget.source.list.indexOf(targetCand) >= 0){
			console.log(`File "${targetCand} already use as source in target "${oTarget.target}""`);
			process.exit(1);
		}
		if (oTarget.source.template === targetCand){
			console.log(`File "${targetCand} already use as template in target "${oTarget.target}""`);
			process.exit(1);
		}
	}
	if (!fs.existsSync(targetCand)){
		fs.writeFileSync(targetCand, '', 'utf8');
	}
	meta.files.push({
		target: targetCand,
		source:{
			template: targetCand,
			list: []
		}
	});
	fs.writeFileSync('__meta__', JSON.stringify(meta, undefined, '\t'), 'utf8');
}
