function(){
`
hello.js - as target and as template

Split template or source (FILE!):
=================================
hello.js/
	__meta__
	hello.js # template
	hello_func1.js
	hello_func2.js
`
	var srcCand = readlineSync.question('Какой файл надо разбить: ');
	var content;
	try{
		content = fs.readFileSync(srcCand, 'utf8')
	}
	catch (e){
		console.log(`Не удалось открыть на чтение файл "${srcCand}"`);
		console.log('Описание ошибки: '+e);
		process.exit(1);
	}
	fs.unlinkSync(srcCand);
	fs.mkdirSync(srcCand);
	fs.writeFileSync(path.resolve(srcCand, srcCand), content, 'utf8');
	var meta = {
		files:[
			{
				target: srcCand,
				source:{
					template:srcCand,
					list:[]
				}
			}
		]
	};
	fs.writeFileSync(path.resolve(srcCand, '__meta__'), JSON.stringify(meta, undefined, '\t'), 'utf8');
}
