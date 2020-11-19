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
	if ((meta.files || []).length === 0){
		console.log('Целей сборки нет: удалять нечего');
		if (meta.hasOwnProperty('files')){
			meta.files = undefined;
			fs.writeFileSync('__meta__', JSON.stringify(meta, undefined, '\t'), 'utf8');
		}
		process.exit(0);
	}
	let variants = [];
	for (const oTarget of meta.files){
		variants.push(oTarget.target);
	}
	let indexToRemove = readlineSync.keyInSelect(variants, 'Выберите, что необходимо удалить: ');
	console.log('indexToRemove: ', indexToRemove);
	if (indexToRemove < 0){
		process.exit(1);
	}
	meta.files.splice(indexToRemove, 1);
	if (meta.files.length === 0){
		meta.files = undefined;
	}
	fs.writeFileSync('__meta__', JSON.stringify(meta, undefined, '\t'), 'utf8');
	process.exit(0);
}
