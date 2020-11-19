function(){
	var srcCand = readlineSync.question('Какой файл надо собрать: ');
	var tmp;
	var meta; // of initial splitted version
	if (!srcCand){
		process.exit(1);
	}
	try{
		meta = fs.readFileSync(path.resolve(srcCand, '__meta__'), 'utf8')
	}
	catch (e){
		tmp = path.resolve(srcCand, '__meta__');
		console.log(`Не удалось открыть на чтение файл "${tmp}"`);
		console.log('Описание ошибки: '+e);
		process.exit(1);
	}
	var pro = `
module.exports = {
	target: '../compiled',
	file:{},
	dir:{}
}`;
	fs.writeFileSync(path.resolve(srcCand, 'pro'), pro, 'utf8');
	tmp = srcCand + '.tmp_join';
	fs.renameSync(srcCand, tmp);
	applyPro(path.resolve(tmp, 'pro'));
	fse.removeSync(tmp);
}
