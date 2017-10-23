var program = require('commander');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var child_process = require('child_process');
var tmpFile = require('tmp').fileSync();
var StringDecoder = require('string_decoder').StringDecoder;
var DECODER = new StringDecoder('utf8');


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
        return -1;
    }
    const destPathStart = processor.target;
    fse.removeSync(path.dirname(compile_ini_path) + '/' + destPathStart);
    tmp = path.dirname(compile_ini_path);
    console.log('\033[93mНачинаю сборку исходников в директории \''+tmp+'\'\033[0m');//выводим жёлтым цветом
    var stack = [tmp];
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
                return; 
            }
            if (!meta.hasOwnProperty('files')){
               continue;
            }
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
        console.log('\033[91mОбрабатываю директорию \''+path.relative(path.dirname(compileIniPath), dirCandidate)+'/\'\033[0m');//выводим красным цветом
        tmp = dirCandidate+'/__meta__';
        try{
            var meta = JSON.parse(fs.readFileSync(tmp, 'utf8'));
        } catch(e) {
            console.log('Файл \''+tmp+'\' не является корректным JSON-файлом. Операция компиляции прервана.');
            console.log('Описание ошибки: '+e);
            break;
        }
        t = path.dirname(compile_ini_path);
        tmp =  path.relative(t, dirCandidate);
        tmp = path.resolve(t, destPathStart, tmp);
        tmp = tmp.replace(/\/+/g, '/')
                 .replace(/(\/)$/, '');
        if (!applyMeta(meta, dirCandidate, tmp, processor, path.dirname(compile_ini_path))){
            console.log('Операция компиляции прервана.');
            return;
        }
    }
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
            let retval = hasTempl ? fs.readFileSync(srcPath + '/'  + file.source.template, 'utf8') : '';
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
                if (hasTempl)
                    retval = retval.replace(new RegExp(`{%% ${srcFile} %%}`, 'gm'), tmp);
                else
                    retval += tmp;
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
        copyDirContent(srcPath, tmpDestPath);
        fs.unlinkSync(`${tmpDestPath}/__meta__`);
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
    var stack = [[srcDirPath, destDirPath]];
    while (stack.length){
        const [parentSrc, parentDest] = stack.pop();
        const children = fs.readdirSync(parentSrc);
        for (const i of children){
            const tmpSrc = `${parentSrc}/${i}`;
            const tmpDest = `${parentDest}/${i}`;
            const stat = fs.statSync(tmpSrc);
            if (stat.isDirectory()){
                fs.mkdirSync(tmpDest);
                stack.push([tmpSrc, tmpDest]);
            }
            else{
                fs.createReadStream(tmpSrc).pipe(fs.createWriteStream(tmpDest));
            }
        }
    }
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
        if (fs.existsSync(aTo)){
            const aToStat = fs.fs.statSync(aTo);
            const wordExists = aToStat.isDirectory() ? 'директория' : 'файл';
            console.log(`Невозможно записать файл '${aTo}' - уже есть ${wordExists} с таким именем.`);
            return false;
        }
        const aFrom = path.resolve(p1, a);
        fs.renameSync(aFrom, aTo);
    }
    while (dirList.length){
        const a = dirPost.pop();
        fs.rmdirSync(path.resolve(p1, a));
    }
    fs.rmdirSync(p1);
    return true;
}
program.parse(process.argv);

