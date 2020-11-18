function(){
`
project/
  src/
    pro
    __meta__
   ...
  compiled/


project/
  some_compiled_1
  some_compiled_2
  src/
    pro
    __meta__
    ...
`;
	if (fs.existsSync('pro')){
		console.log('File \"pro\" already exists');
		process.exit(1);
	}
	/*readline.emitKeypressEvents(process.stdin);
	process.stdin.setRawMode(true);
	process.stdout.write('');
	var compiledDirPath = '';
	var cursorPosition = 0;
	process.stdin.on('keypress', function(p_str, p_key){
		//console.log(p_key);
		if (p_key.name === 'backspace'){
			compiledDirPath = compiledDirPath.slice(0, -1);
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(compiledDirPath);
		}
		else if (p_key.name === 'left'){
			if (cursorPosition > 0){
				--cursorPosition;
				process.stdout.cursorTo(cursorPosition);
			}
		}
		else if (p_key.name === 'right'){
			if (cursorPosition < (compiledDirPath.length - 1)){
				++cursorPosition;
				process.stdout.cursorTo(cursorPosition);
			}
		}
		else if (p_key.name === 'return'){
			console.log('result: ', compiledDirPath);
			compiledDirPath = '';
			cursorPosition = 0;
		}
		else{
			if ('qwertyuiopasdfghjklzxcvbnm./\()-_=QWERTYUIOPASDFGHJKLZXCVBNM '.indexOf(p_str) >= 0){
				compiledDirPath = compiledDirPath.slice(0, cursorPosition) + p_str + compiledDirPath.slice(cursorPosition);
				++cursorPosition;
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write(compiledDirPath);
				process.stdout.cursorTo(cursorPosition);
			}
			else{
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write(compiledDirPath);
			}
		}
	});*/
	console.log('Внимание! Результаты сборки не могут находиться в одной директории с исходниками, так что при задании директории для результатов сборки используйте вышележащие директории');
	var compiledDirPath = readlineSync.question('В какую директорию писать результаты сборки [по умолчанию: ../compiled]: ') || '../compiled';
	var pro = `module.exports = {
	target: '${compiledDirPath}',
	file:{},
	dir:{}
}`;
	var meta = {};

	var targets = [];
	console.log('Вводите имена файлов, которые должны быть в результате сборки (каждый файл на отдельной строке, окончание ввода - дважды "Enter")');
	var tmp;
	while (tmp = readlineSync.question('> ')){
		targets.push(tmp);
	}
	console.log(JSON.stringify(targets));
	if (targets.length > 0){
		meta.files = [];
		for (const o of targets){
			meta.files.push({target: o, source:{template: o, list:[]}});
			fs.writeFileSync(o, '', 'utf8');
		}
	}


	var ifDirNeeded = readlineSync.question('Нужно ли сохранить файлы в отдельной директории (если нет, то все файлы и поддиретории из диретории сборки будут перемещены на уровень выше, а сама диретория сборки будет удалена): [Y/n]') || 'y';
	ifDirNeeded = (['y', 'Y', 'yes', 'Yes'].indexOf(ifDirNeeded) < 0) ? false : true;
	if (ifDirNeeded){
		meta.dir_proc = [];
	}


	fs.writeFileSync('pro', pro, 'utf8');
	fs.writeFileSync('__meta__', JSON.stringify(meta, undefined, '\t'), 'utf8');
}
