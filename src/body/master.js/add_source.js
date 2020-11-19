function(p_source){
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
	let variants = [];
	for (const oTarget of meta.files){
		variants.push(oTarget.target);
	}
	let targetIndex = readlineSync.keyInSelect(variants, 'Выберите цель сборки, к которой надо добавить исходник: ');
	if (targetIndex < 0){
		process.exit(1);
	}
	var tmp = meta.files[targetIndex];
	if (meta.files[targetIndex].source.list.length === 0){
		console.log(`В данный момент для сборки цели "${tmp.target}" не используются какие-либо исходники`);
	}
	else{
		console.log(`В данный момент для сборки цели "${tmp.target}" используются следующие исходники:`);
		for (const oSrc of meta.files[targetIndex].source.list){
			console.log(oSrc);
		}
	}
	var sources = [];
	console.log('Вводите имена файлов, которые должны быть в результате сборки (каждый файл на отдельной строке, окончание ввода - дважды "Enter")');
	var tmp;
	while (tmp = readlineSync.question('> ')){
		sources.push(tmp);
	}
	for (const oSourceCand of sources){
		if (!fs.existsSync(oSourceCand)){
			fs.writeFileSync(oSourceCand, '', 'utf8');
		}
		meta.files[targetIndex].source.list.push(oSourceCand);
	}
	fs.writeFileSync('__meta__', JSON.stringify(meta, undefined, '\t'), 'utf8');
}
