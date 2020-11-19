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
	let targetIndex = readlineSync.keyInSelect(variants, 'Выберите цель сборки, от которой надо открепить исходники: ');
	if (targetIndex < 0){
		process.exit(1);
	}
	var tmp = meta.files[targetIndex];
	if (meta.files[targetIndex].source.list.length === 0){
		console.log(`В данный момент для сборки цели "${tmp.target}" не используются какие-либо исходники`);
		process.exit(1);
	}
	var sourceIndexToRemove;
	do{
		if (sourceIndexToRemove !== undefined){
			tmp.source.list.splice(sourceIndexToRemove, 1);
		}
		if (tmp.source.list.length === 0){
			console.log(`Удалены все исходники из цели сбрки "${tmp.target}"`);
			break;
		}
		variants = []
		for (const oSrc of tmp.source.list){
			variants.push(oSrc);
		}
		console.log(`В данный момент для сборки цели "${tmp.target}" используются следующие исходники:`);
	} while ((sourceIndexToRemove = readlineSync.keyInSelect(variants, 'Что удалить: '))>= 0);
	fs.writeFileSync('__meta__', JSON.stringify(meta, undefined, '\t'), 'utf8');
}
