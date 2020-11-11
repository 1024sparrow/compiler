#!/usr/bin/node
/*
 * compiler <https://github.com/1024sparrow/compiler>
 * Утилита для многоэтапной сборки проектов.
 * Utility for multistage project building.
 * 
 * Авторское право (c) 2017, Борис Васильев.
 * Публикуется под лицензией MIT.
 *
 * Copyright (c) 2017, Boris Vasilyev.
 * Released under the MIT license.
 */

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
	console.log('\nКомпилятор кода.\n================\nПрограмма принимает в качестве параметра путь к compile.ini.\nИмя файла \'compile.ini\' упоминается условно - вы можете произвольным образом назвать этот файл. Я, например, называю его как \'<название_проекта>.pro\'.\nВ папках с исходниками предполагается наличие файлов __meta__ (если такого файла в папке нет, то компилироваться папка не будет)\ncompile.ini:\n------------\nЗдесь определяются правила компиляции (строковый идентификатор и обрабатывающая функция(на JavaScript))\nОформляется как NodeJS-модуль:\nmodule.exports = {\n    target: \'compiled\', // <-- здесь будет формироваться результат компиляции\n    file_script_dir: \'\', //* относительный путь к директории, относительно которой будут указываться пути к скриптам для обработки файлов. Если свойство не указано - пути относительно директории, где находится файл compile.ini.\n    file: {\n        css:function(srcText){ // <-- типы файлов \'css\' будут обрабатываться вот этой функцией. Функция должна вернуть результат в виде строки.\n        }\n        // вместо функции можно указать путь к скрипту, который должен преобразовать данные в файле, полный путь к которому будет передан единственным параметром.\n    },\n    dir_script_dir: \'\', //* относительный путь к директории, относительно которой будут указываться пути к скриптам для обработки директорий. Если свойство не указано - пути относительно директории, где находится файл compile.ini.\n    dir: {\n        tab_app:function(dirPath, dirName){ // <--передаётся абсолютный путь до папки, содержащей целевую папку, и имя целевой папки. Этот обработчик будет применяться к директориям, помеченным как \'tab_app\'.\n        }\n        // вместо функции можно указать путь к скрипту, который должен преобразовать директорию. Скрипту передаются два параметра - такие, как передавались бы в фунцию (см. выше).\n    }\n}\n\n__meta__:\n---------\nЗдесь определяются цели компиляции, исходники и указываются идентификаторы обработчиков (из compile.ini).\nОформляется как JSON.\n{\n    files: [{..},{..}], //<-- Если это свойство есть, то собираем указанные файлы. Если этого свойства нет, то тупо копируем всю директорию.\n    dir_proc: [\'..\',\'..\'], //<-- Перечень обработчиков, которые необходимо применить к результирующей директории. Если нужно сохранить директорию (т.е. результаты компиляции будут в такой же папке, а не положены вместо неё), то свойство должно быть, пусть в массиве и не будет элементов.\n    remove: [] //<-- какие файлы и директории (от компиляции поддиректорий) надо удалить. Удалено будет перед запуском обработчиков из dir_proc\n}\n\nФормат описания правила компиляции файла (такой объект кладём в массив files):\n{\n    target: \'..\',//имя, не путь\n    type: [\'..\',\'..\'],//* обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (постобработка, после формирования из составляющих)\n    source:{\n        list: [\'1.js\', \'2.js\'],\n        template: \'..\', //* путь до файла с шаблоном\n        types:{\n            \'1.js\': [\'..\',\'..\'] // обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (предобработка, перед вставкой в целевой файл)\n        }\n    }\n}\n// * - необязательное свойство\n\nПри написании шаблона как ссылаться на файлы-исходники:\n{%% 1.js %%}\n1.js - имя файла (не забудьте его прописать в __meta__ !). Между \'%\' и именем файла обязательно должен быть один пробел.\n\nПростейший файл __meta__:\n-------------------------\n{\n    \"dir_proc\": []\n}\nЧто он делает - сохраняет директорию как есть. Если файл __meta__ отсутсвует или в нём нет свойства \'dir_proc\', такой папки в результатах компиляции не будет.\n\nСм. также:\n    - https://www.npmjs.com/package/node-minify\n    - var stripComments = require(\'strip-comments\');data = stripComments(data);\nАвтор: Васильев Б.П.\n');
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
function applyMeta(meta, srcPath, destPath, processor, processorDirPath){ 
	const tmpDestPath = destPath + '.tmp';
	createFullPath(tmpDestPath);
	const bF = meta.hasOwnProperty('files');
	const bD = meta.hasOwnProperty('dir_proc');
	if (bF){
		for (const file of meta.files){
			const hasTempl = file.source.hasOwnProperty('template');
			let retval = '';
			if (hasTempl){
				const tmp = path.resolve(destPath, file.source.template);
				if (fs.existsSync(tmp))
					retval = fs.readFileSync(tmp, 'utf8');
				else{
					const t = path.resolve(srcPath, file.source.template);
					if (fs.existsSync(t)){
						retval = fs.readFileSync(t, 'utf8');
					}
					else{
						console.log(`Файл шаблона ${tmp} не найден. Операция компиляции прервана.`);
						return false;
					}
				}
			}
			for (const srcFile of file.source.list){
				let tmp = destPath + '/'  + srcFile;
				if (fs.existsSync(tmp)){
					tmp = fs.readFileSync(tmp, 'utf8');
					//мы использовали в качестве исходников результаты компиляции поддиректории - мы должны будем перед окончанием компиляции текущей директории удалить эту директорию с исходниками (это надо делать ДО того, как будут мёржиться временная директория в целевую)
				}
				else{
					tmp = srcPath + '/'  + srcFile;
					if (fs.existsSync(tmp))
						tmp = fs.readFileSync(tmp, 'utf8');
					else{
						console.log(`Не найден файл ${tmp}: операция компиляции прервана.`);
						return false;
					}
				}
				if (file.source.hasOwnProperty('types') && file.source.types.hasOwnProperty(srcFile)){
					for (const filetype of file.source.types[srcFile]){
						if (processor.file.hasOwnProperty(filetype)){
							const tmpFunc = processor.file[filetype];
							const tmpType = typeof tmpFunc;
							if (tmpType === 'string'){
								fs.writeFileSync(tmpFile.name, tmp, 'utf8');
								const tt = path.resolve(processorDirPath, tmpFunc) + ' ' + tmpFile.name;
								const ou = child_process.execSync(tt, {encoding:'utf8', stdio:[0,1,2]});
								if (ou)
									console.log(DECODER.write(ou));
								tmp = fs.readFileSync(tmpFile.name, 'utf8');
								//tmpFile.cleanupCallback();
							}
							else if (tmpType === 'function'){
								tmp = tmpFunc(tmp);
							}
							else{
								console.log(`Для типа файла ${filetype} указан некорректный обработчик: операция компиляции прервана.`);
								return false;
							}
						}
						else{
							console.log(`Для типа файла '${filetype}' не найден обработчик: файл остался необработанным.`);
						}
					}
				}
				if (hasTempl){
					const key = `{%% ${srcFile} %%}`;
					for (let i = retval.indexOf(key) ; i >= 0 ; i = retval.indexOf(key, i + tmp.length + 1)){
						retval = retval.slice(0, i) + tmp + retval.slice(i + key.length + 1);// boris here
					}
				}
				else{
					retval += tmp;
				}
			}
			//Применяем обработчики к получившемуся файлу
			if (file.hasOwnProperty('type')){
				for (const filetype of file.type){
					if (processor.file.hasOwnProperty(filetype)){
						const tmpFunc = processor.file[filetype];
						const tmpType = typeof tmpFunc;
						if (tmpType === 'string'){
							fs.writeFileSync(tmpFile.name, retval, 'utf8');
							const ou = 
									child_process.execSync(
										path.resolve(processorDirPath, tmpFunc) + ' ' + tmpFile.name,
										{encoding:'utf8', stdio:[0,1,2]}
										);
							if (ou)
								console.log(DECODER.write(ou));
							retval = fs.readFileSync(tmpFile.name, 'utf8');
							//tmpFile.cleanupCallback();
						}
						else if (tmpType === 'function'){
							retval = tmpFunc(retval);
						}
						else{
							console.log(`Для типа файла ${filetype} указан некорректный обработчик: операция компиляции прервана.`);
							return false;
						}
					}
					else{
						console.log(`Для типа файла ${filetype} указан некорректный обработчик: операция компиляции прервана.`);
						return false;
					}
				}
			}
			fs.writeFileSync(tmpDestPath + '/' + file.target, retval);
		}
	}
	else{
		if (srcPath === processorDirPath){
			copyDirContent(destPath, tmpDestPath);
		}
		else{
			copyDirContent(srcPath, tmpDestPath);
			fs.unlinkSync(`${tmpDestPath}/__meta__`);
		}
	}
	if (meta.hasOwnProperty('remove')){
		for (const i of meta.remove){
			const t = path.resolve(destPath, i);
			if (fs.existsSync)
				fse.removeSync(t);
			else{
				console.log(`Невозможно удалить файл/директорию '${t}' - такого нет. Правила компиляции некорректны. Операция компиляции прервана.`);
				return false;
			}
		}
	}
	if (bD){
		if (!mergeDirs(tmpDestPath, destPath)){
			console.log('Произошёл конфликт при слиянии результатов компиляции разных директорий. Операция компиляции прервана.');
			return false;
		}
		for (const dirFuncId of meta.dir_proc){
			if (processor.dir.hasOwnProperty(dirFuncId)){
				const tmpFunc = processor.dir[dirFuncId];
				const tmpType = typeof tmpFunc;
				const p1 = path.dirname(destPath);
				const p2 = destPath.match(/([^\/])*$/g)[0];
				if (tmpType === 'string'){
					console.log(`Выполняется скрипт '${path.resolve(processorDirPath, tmpFunc)} ${p1} ${p2}'.`);
					const ou = 
							child_process.execSync(
								`${path.resolve(processorDirPath, tmpFunc)} ${p1} ${p2}`
								);
					if (ou)
						console.log(DECODER.write(ou));
				}
				else if (tmpType === 'function'){
					tmpFunc(p1, p2);
				}
				else{
					console.log(`Для типа директории '${dirFuncId}' указан некорректный обработчик: опреация компиляции прервана.`);
					return false;
				}
			}
			else{
				console.log(`Обработчик диретории '${dirFuncId}' не найден - директория '${destPath}' осталась необработанной.`);
			}
		}
	}
	else{
		const t = path.resolve(tmpDestPath, '..')
		for (const i of fs.readdirSync(tmpDestPath)){
			fse.moveSync(tmpDestPath + '/' + i, t + '/' + i);
		}
		fse.removeSync(tmpDestPath);
	}
	return true;
}

function createFullPath(fullPath){
	var tmp_list = fullPath.split('/');
	tmp_list.shift();
	if (tmp_list.length == 0)
		return;
	var tmp = '';
	while (tmp_list.length){
		tmp += '/' + tmp_list.shift();
		if (!fs.existsSync(tmp))
			fs.mkdirSync(tmp);
	}
}
function copyDirContent(srcDirPath, destDirPath){
	fse.copySync(srcDirPath, destDirPath, {dereference:true});
}
function mergeDirs(p_fromDir, p_toDir){

	var p1 = p_fromDir;
	var p2 = p_toDir;
	if (fs.existsSync(p2)){
		const p2Stat = fs.statSync(p2);
		if (!p2Stat.isDirectory()){
			console.log(`Невозможно создать директорию '${p2}' - по этому адресу уже есть файл (не директория).`);
			return false;
		}
	}
	else{
		fs.renameSync(p1, p2);
		return true;
	}

	var dirList = [];
	var list = [];

	var stack = [p1];
	while (stack.length){
		const a = stack.pop();
		const children = fs.readdirSync(a);
		for (const i of children){
			const childFullPath = `${a}/${i}`;
			const stat = fs.statSync(childFullPath);
			if (stat.isDirectory()){
				stack.push(childFullPath);
				dirList.push(path.relative(p1, childFullPath));
			}
			else{
				list.push(path.relative(p1, childFullPath));
			}
		}
	}
	for (var i = 0 ; i < dirList.length ; i++){
		const a = path.resolve(p2, dirList[i]);
		if (fs.existsSync(a)){
			const aStat = fs.statSync(a);
			if (!aStat.isDirectory()){
				console.log(`Невозможно создать директорию '${a}' - на этом месте уже есть файл (не директория).`);
				return false;
			}
		}
		else{
			fs.mkdirSync(a);
		}
	}
	while (list.length){
		const a = list.pop();
		const aTo = path.resolve(p2, a);
		/*
		Проверка на существование файла тоключена, так как файлы действительно могут замещаться своими более новыми версиями (обработанными).
		if (fs.existsSync(aTo)){
			const aToStat = fs.statSync(aTo);
			const wordExists = aToStat.isDirectory() ? 'директория' : 'файл';
			console.log(`Невозможно записать файл '${aTo}' - уже есть ${wordExists} с таким именем.`);
			return false;
		}
		*/
		const aFrom = path.resolve(p1, a);
		fs.renameSync(aFrom, aTo);
	}
	while (dirList.length){
		const a = dirList.pop();
		fs.rmdirSync(path.resolve(p1, a));
	}
	fs.rmdirSync(p1);
	return true;
}

program.parse(process.argv);

