const program = require('commander');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const child_process = require('child_process');
const tmpFile = require('tmp').fileSync();
const StringDecoder = require('string_decoder').StringDecoder;
const DECODER = new StringDecoder('utf8');

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
	'ready_add_source'
	'ready_add_target'
	*/
	state = '',
	proPath
;

for (oArg of process.argv){
	if (oArg === '--help'){
		console.log('{% help.txt %%}'); // плохая подстановка (после обработки файла съедается закрывающая кавычка (которая определена в сасос шаблоне))
		process.exit(0);
	}
}

for (iArg = 2 ; iArg < process.argv.length ; ++iArg){
	oArg = process.argv[iArg];
	console.log('arg: ', oArg);

	if (state === ''){
		if (oArg === 'add'){
			state = 'add';
		}
		else if (oArg === 'init'){
			state = 'init';
		}
		else{
			proPath = oArg;
			state = 'ready_compile';
		}
	}
	else if (state === 'init'){
	}
	else if (state === 'add'){
		if (oArg === 'source'){
			state = 'add_source';
		}
		else if (oArg === 'target'){
			state = '';
		}
		else{
			console.log('');
		}
	}
	else if (state === 'add_source'){
	}
	else if (state === 'add_target'){
	}
	else if (state === 'ready_compile'){
		console.log('Поддерживается сборка только одного проекта (лишние аргументы переданы)');
		process.exit(1);
	}
	else if (state === 'ready_add_source'){
	}
	else if (state === 'ready_add_target'){
	}
}

if (proPath){
	({%% process.js %%} )(proPath);
}


program.version('1.0')
	.option('-i, --info', 'Показать информацию по предстоящей сборке');
program.on('--help', function(){
	//console.log('{% help.txt %%}');
});
program.on('--info', function(){
	console.log('123');
});
program.arguments('<путь_до_compile.ini>');
{%% applymeta.js %%}
{%% utils.js %%}
program.parse(process.argv);
