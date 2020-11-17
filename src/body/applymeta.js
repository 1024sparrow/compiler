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
						let indent = '';
						let iIndent = i;
						for (iIndent = i - 1 ; iIndent >= 0 ; --iIndent){
							const tmpChar = retval[iIndent];
							if ((tmpChar === ' ') || (tmpChar === '\t')){
								indent = tmpChar + indent;
							}
							else{
								break;
							}
						}
						if (indent){
							console.log(`indent: "${indent}"`);
							let isLast = true;
							for (let i = tmp.length - 1 ; i >= 0; --i){
								if (isLast){
									isLast = false;
								}
								else{
									if (tmp[i] == '\n'){
										tmp = tmp.slice(0,i) + '\n' + indent + tmp.slice(i + 1);
									}
								}
							}
						}
						retval = retval.slice(0, i) + tmp.slice(0, -1) + retval.slice(i + key.length);
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
