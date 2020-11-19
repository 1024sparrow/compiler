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
	state = 0, // 0 - initial, 1 - compile(core), 2 - master mode, 3 - help for master mode
	proPath,
	//masterTree = {% master.js %%} // отступы: применять только если между предшествующими \n и <space> нет букв
	masterTree =
	{%% master.js %%},
	processor,
	command = '',
	applyPro = {%% process.js %%}
;

for (oArg of process.argv){
	if (oArg === '--help'){
		console.log('{%% help.txt %%} '); // тут выявилась бага обработки файлов: на вход обработчика файла попадает закрывающая кавычка
		process.exit(0);
	}
}

for (iArg = 2 ; iArg < process.argv.length ; ++iArg){
	oArg = process.argv[iArg];
	//console.log('arg: ', oArg);
	if (state === 0){
		if (oArg === 'help'){
			command += 'help';
			state = 3;
			continue;
		}
		else if (masterTree.hasOwnProperty(oArg)){
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

	if (state === 2 || state === 3){
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
	process.exit(1);
}
if (state === 1){
	processor(proPath);
}
else {
	if (state === 3){
		if (typeof masterTree === 'function'){
			masterTree(true);
		}
		else{
			console.log('Available subcommands:');
			for (const o of Object.keys(masterTree)){
				console.log(`  ${o}`);
			}
			console.log(`Call "${command} <subcommand>" for details`);
		}
		process.exit(0);
	}
	if (typeof masterTree !== 'function'){
		console.log('incorrect 3', typeof masterTree);
		process.exit(1);
	}
	masterTree(false);
}

{%% applymeta.js %%}
{%% utils.js %%}
