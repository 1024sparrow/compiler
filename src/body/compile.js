const program = require('commander');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const child_process = require('child_process');
const tmpFile = require('tmp').fileSync();
const StringDecoder = require('string_decoder').StringDecoder;
const DECODER = new StringDecoder('utf8');


program.version('1.0')
	.option('-i, --info', 'Показать информацию по предстоящей сборке');
program.on('--help', function(){
	console.log('{%% help.txt %%}');
});
program.on('--info', function(){
	console.log('123');
});
program.arguments('<путь_до_compile.ini>');
var processor; 
program.action(function(compileIniPath){
	var tmp, t;
	var compile_ini_path = path.resolve(path.resolve('./'), compileIniPath);
	try{
		var processor = require(compile_ini_path);
	} catch (err) {
		console.log('Не найден файл \''+compileIniPath+'\' или он не является корректным  NodeJS-модулем.');
		process.exit(1);
	}
	var compileIniDir = path.dirname(compile_ini_path);
	t = compile_ini_path;
	fse.copySync(compileIniDir, compileIniDir + '.tmp');
	compileIniDir += '.tmp';
	compileIniPath = path.resolve(compileIniDir, path.basename(compileIniPath));
	compile_ini_path = compileIniPath;
	if (processor.hasOwnProperty('prebuild')){
		let prebuild = processor.prebuild;
		if (typeof prebuild !== 'object' || !(prebuild instanceof Array)){
			console.log(`Файл проекта '${path.basename(t)}' имеет свойство 'prebuild', но это свойство не является массивом. Операция компиляции прервана.`);
			process.exit(1);
		}
		for (const i of prebuild){
			if (typeof i === 'function'){
				i(compileIniDir);
			}
			else if (typeof i === 'string'){
				const tt = path.resolve(compileIniDir, i) + ' ' + compileIniDir;
				const ou = child_process.execSync(tt, {encoding:'utf8', stdio:[0,1,2]});
				if (ou)
					console.log(DECODER.write(ou));
			}
			else{
				console.log('Некорректный тип обработчика в составе \'prebuild\'. Операция компиляции прервана.');
				process.exit(1);
			}
		}
	}

	const destPathStart = processor.target;
	fse.removeSync(path.dirname(compile_ini_path) + '/' + destPathStart);//boris return: тут я, видимо, пьяный был...
	console.log('\033[93mНачинаю сборку исходников в директории \''+path.dirname(t)+'\'\033[0m');//выводим жёлтым цветом
	var stack = [compileIniDir];
	var dirStack = [];
	while (stack.length){
		var parent = stack.pop();
		tmp = parent + '/__meta__';
		if (fs.existsSync(tmp)){
			dirStack.push(parent);
			//если здесь есть '__meta__', и в нём нет 'files', НЕ кладём в стек детей (не спускаемся глубже)
			//отсутствие 'files' означает, что в результаты будет копироваться папка целиком
			try{
				var meta = JSON.parse(fs.readFileSync(tmp, 'utf8'));
			} catch(e) {
				console.log('Файл \''+tmp+'\' не является корректным JSON-файлом. Операция компиляции прервана.');
				console.log('Описание ошибки: '+e);
				process.exit(1);
			}
			if ((!meta.hasOwnProperty('files')) && (tmp != path.resolve(compileIniDir, '__meta__')))
				continue;
		}


		var children = fs.readdirSync(parent);
		for (var i = 0 ; i < children.length ; i++){
			tmp = parent + '/' + children[i];
			var stat = fs.statSync(tmp);
			if (stat.isDirectory()){
				stack.push(tmp);
			}
		}
	}
	var destDir;
	while (dirStack.length){
		var dirCandidate = dirStack.pop();
		console.log('\033[91mОбрабатываю директорию \''+path.relative(compileIniDir, dirCandidate)+'/\'\033[0m');//выводим красным цветом
		tmp = dirCandidate+'/__meta__';
		try{
			var meta = JSON.parse(fs.readFileSync(tmp, 'utf8'));
		} catch(e) {
			console.log('Файл \''+tmp+'\' не является корректным JSON-файлом. Операция компиляции прервана.');
			console.log('Описание ошибки: '+e);
			break;
		}
		t = compileIniDir;
		tmp =  path.relative(t, dirCandidate);
		tmp = path.resolve(t, destPathStart, tmp);
		tmp = tmp.replace(/\/+/g, '/')
				 .replace(/(\/)$/, '');
		if (!applyMeta(meta, dirCandidate, tmp, processor, compileIniDir)){
			console.log('Операция компиляции прервана.');
			process.exit(1);
		}
	}
	fse.removeSync(compileIniDir);
	console.log('\033[93mСборка успешно завершена\033[0m');//выводим жёлтым цветом
});
{%% applymeta.js %%}
{%% utils.js %%}
program.parse(process.argv);
