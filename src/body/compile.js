const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const child_process = require('child_process');
const tmpFile = require('tmp').fileSync();
const StringDecoder = require('string_decoder').StringDecoder;
const DECODER = new StringDecoder('utf8');
const readlineSync = require('readline-sync');

var
	iArg,
	oArg,
	/* state:
	'' - initial state
	'init' - initialize project
	'add' - add .. (source or target?)
	'add_source' - add source
	'add_target'
	'ready_compile'
	'ready_init'
	'ready_add_source'
	'ready_add_target'
	*/
	state = 0, // 0 - initial, 1 - compile(core), 2 - master mode
	proPath,
	//masterTree = {% master.js %%} // отступы: применять только если между предшествующими \n и <space> нет букв
	masterTree =
	{%% master.js %%},
	processor,
	command = ''
;

for (oArg of process.argv){
	if (oArg === '--help'){
		console.log('\nКомпилятор кода.\n================\n\nТо, что помечено звёздочкой, не реализовано.\n\nАргументы:\n--help - показать эту справку\n*--hinting - при компиляции производить анализ исходных файлов и предлагать добавить (убрать) файлы из проекта\n\nПрограмма принимает в качестве параметра путь к compile.ini.\nИмя файла \'compile.ini\' упоминается условно - вы можете произвольным образом назвать этот файл. Я, например, называю его как \'<название_проекта>.pro\'.\nВ папках с исходниками предполагается наличие файлов __meta__ (если такого файла в папке нет, то компилироваться папка не будет)\ncompile.ini:\n------------\nЗдесь определяются правила компиляции (строковый идентификатор и обрабатывающая функция(на JavaScript))\nОформляется как NodeJS-модуль:\nmodule.exports = {\n    target: \'compiled\', // <-- здесь будет формироваться результат компиляции\n    file_script_dir: \'\', //* относительный путь к директории, относительно которой будут указываться пути к скриптам для обработки файлов. Если свойство не указано - пути относительно директории, где находится файл compile.ini.\n    file: {\n        css:function(srcText){ // <-- типы файлов \'css\' будут обрабатываться вот этой функцией. Функция должна вернуть результат в виде строки.\n        }\n        // вместо функции можно указать путь к скрипту, который должен преобразовать данные в файле, полный путь к которому будет передан единственным параметром.\n    },\n    dir_script_dir: \'\', //* относительный путь к директории, относительно которой будут указываться пути к скриптам для обработки директорий. Если свойство не указано - пути относительно директории, где находится файл compile.ini.\n    dir: {\n        tab_app:function(dirPath, dirName){ // <--передаётся абсолютный путь до папки, содержащей целевую папку, и имя целевой папки. Этот обработчик будет применяться к директориям, помеченным как \'tab_app\'.\n        }\n        // вместо функции можно указать путь к скрипту, который должен преобразовать директорию. Скрипту передаются два параметра - такие, как передавались бы в фунцию (см. выше).\n    }\n}\n\n__meta__:\n---------\nЗдесь определяются цели компиляции, исходники и указываются идентификаторы обработчиков (из compile.ini).\nОформляется как JSON.\n{\n    files: [{..},{..}], //<-- Если это свойство есть, то собираем указанные файлы. Если этого свойства нет, то тупо копируем всю директорию.\n    dir_proc: [\'..\',\'..\'], //<-- Перечень обработчиков, которые необходимо применить к результирующей директории. Если нужно сохранить директорию (т.е. результаты компиляции будут в такой же папке, а не положены вместо неё), то свойство должно быть, пусть в массиве и не будет элементов.\n    remove: [] //<-- какие файлы и директории (от компиляции поддиректорий) надо удалить. Удалено будет перед запуском обработчиков из dir_proc\n}\n\nФормат описания правила компиляции файла (такой объект кладём в массив files):\n{\n    target: \'..\',//имя, не путь\n    type: [\'..\',\'..\'],//* обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (постобработка, после формирования из составляющих)\n    source:{\n        list: [\'1.js\', \'2.js\'],\n        template: \'..\', //* путь до файла с шаблоном\n        types:{\n            \'1.js\': [\'..\',\'..\'] // обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (предобработка, перед вставкой в целевой файл)\n        }\n    }\n}\n// * - необязательное свойство\n\nПри написании шаблона как ссылаться на файлы-исходники:\n{%% 1.js %%}\n1.js - имя файла (не забудьте его прописать в __meta__ !). Между \'%\' и именем файла обязательно должен быть один пробел.\n\nПростейший файл __meta__:\n-------------------------\n{\n    \"dir_proc\": []\n}\nЧто он делает - сохраняет директорию как есть. Если файл __meta__ отсутсвует или в нём нет свойства \'dir_proc\', такой папки в результатах компиляции не будет.\n\nСм. также:\n    - https://www.npmjs.com/package/node-minify\n    - var stripComments = require(\'strip-comments\');data = stripComments(data);\nАвтор: Васильев Б.П.\n\ '); // тут выявилась бага обработки файлов: на вход обработчика файла попадает закрывающая кавычка
		process.exit(0);
	}
}


for (iArg = 2 ; iArg < process.argv.length ; ++iArg){
	oArg = process.argv[iArg];
	//console.log('arg: ', oArg);
	if (state === 0){
		if (masterTree.hasOwnProperty(oArg)){
			state = 2;
		}
		else{
			proPath = oArg;
			state = 1;
		}
	}
	else if (state === 1){
		console.log('Поддерживается сборка только одного проекта (лишние аргументы переданы)');
		process.exit(1);
	}

	if (state == 2){
		if (masterTree[oArg]){
			masterTree = masterTree[oArg].children || masterTree[oArg];
		}
		else{
			if (typeof masterTree === 'function'){
				console.log(`Лишние аргументы даны для команды "${command}"`);
			}
			else{
				console.log(`incorrect arguments for command "${command}". Available variants:`);
				for (const o of Object.keys(masterTree)){
					console.log(`  ${o}`);
				}
			}
			process.exit(1);
		}
		if (command)
			command += ' ';
		command += oArg;
	}
}

if (state == 0){
	console.log('no arguments is not valid. See help.');
}
else if (state === 1){
	({%% process.js %%})(proPath);
}
else if (state === 2){
	if (typeof masterTree !== 'function'){
		console.log('incorrect 3', typeof masterTree);
		process.exit(1);
	}
	masterTree();
}

{%% applymeta.js %%}
{%% utils.js %%}
