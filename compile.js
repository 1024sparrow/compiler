#!/usr/bin/node

var program = require('commander');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var child_process = require('child_process');
var tmpFile = require('tmp').fileSync();
program.version('1.0')
    .option('-i, --info', 'Показать информацию по предстоящей сборке');
program.on('--help', function(){
    console.log('\nКомпилятор кода.\n================\nПрограмма принимает в качестве параметра путь к compile.ini.\nИмя файла \'compile.ini\' упоминается условно - вы можете произвольным образом назвать этот файл. Я, например, называю его как \'<название_проекта>.pro\'.\nВ папках с исходниками предполагается наличие файлов __meta__ (если такого файла в папке нет, то компилироваться папка не будет)\ncompile.ini:\n------------\nЗдесь определяются правила компиляции (строковый идентификатор и обрабатывающая функция(на JavaScript))\nОформляется как NodeJS-модуль:\nmodule.exports = {\n    target: \'compiled\', // <-- здесь будет формироваться результат компиляции\n    file_script_dir: \'\', //* относительный путь к директории, относительно которой будут указываться пути к скриптам для обработки файлов. Если свойство не указано - пути относительно директории, где находится файл compile.ini.\n    file: {\n        css:function(srcText){ // <-- типы файлов \'css\' будут обрабатываться вот этой функцией. Функция должна вернуть результат в виде строки.\n        }\n        // вместо функции можно указать путь к скрипту, который должен преобразовать данные в файле, полный путь к которому будет передан единственным параметром.\n    },\n    dir_script_dir: \'\', //* относительный путь к директории, относительно которой будут указываться пути к скриптам для обработки директорий. Если свойство не указано - пути относительно директории, где находится файл compile.ini.\n    dir: {\n        tab_app:function(dirPath, dirName){ // <--передаётся абсолютный путь до папки, содержащей целевую папку, и имя целевой папки. Этот обработчик будет применяться к директориям, помеченным как \'tab_app\'.\n        }\n        // вместо функции можно указать путь к скрипту, который должен преобразовать директорию. Скрипту передаются два параметра - такие, как передавались бы в фунцию (см. выше).\n    }\n}\n\n__meta__:\n---------\nЗдесь определяются цели компиляции, исходники и указываются идентификаторы обработчиков (из compile.ini).\nОформляется как JSON.\n{\n    files: [{..},{..}], //<-- Если это свойство есть, то собираем указанные файлы. Если этого свойства нет, то тупо копируем всю директорию.\n    dir_proc: [\'..\',\'..\'] //<-- Перечень обработчиков, которые необходимо применить к результирующей директории. Если нужно сохранить директорию (т.е. результаты компиляции будут в такой же папке, а не положены вместо неё), то свойство должно быть, пусть в массиве и не будет элементов.\n}\n\nФормат описания правила компиляции файла (такой объект кладём в массив files):\n{\n    target: \'..\',//имя, не путь\n    type: [\'..\',\'..\'],//* обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (постобработка, после формирования из составляющих)\n    source:{\n        list: [\'1.js\', \'2.js\'],\n        template: \'..\', //* путь до файла с шаблоном\n        types:{\n            \'1.js\': [\'..\',\'..\'] // обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (предобработка, перед вставкой в целевой файл)\n        }\n    }\n}\n// * - необязательное свойство\n\nПри написании шаблона как ссылаться на файлы-исходники:\n{%% 1.js %%}\n1.js - имя файла (не забудьте его прописать в __meta__ !). Между \'%\' и именем файла обязательно должен быть один пробел.\n\nПростейший файл __meta__:\n-------------------------\n{\n    \"dir_proc\": []\n}\nЧто он делает - сохраняет директорию как есть. Если файл __meta__ отсутсвует или в нём нет свойства \'dir_proc\', такой папки в результатах компиляции не будет.\n\nСм. также:\n    - https://www.npmjs.com/package/node-minify\n    - var stripComments = require(\'strip-comments\');data = stripComments(data);\nАвтор: Васильев Б.П.\n');
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
    var stack = [path.dirname(compile_ini_path)];
    console.log(stack);
    var dirStack = [];
    while (stack.length){
        var parent = stack.pop();
        if (fs.existsSync(parent + '/__meta__'))
            dirStack.push(parent);
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
        tmp = dirCandidate+'/__meta__';
        try{
            var meta = JSON.parse(fs.readFileSync(tmp, 'utf8'));
        } catch(err) {
            console.log('Файл \''+tmp+'\' не является корректным JSON-файлом. Операция компиляции прервана.');
            break;
        }
        t = path.dirname(compile_ini_path);
        tmp =  path.relative(t, dirCandidate);
        tmp = t + '/' + destPathStart + '/' + tmp;
        tmp = tmp.replace(/\/+/g, '/')
                 .replace(/(\/)$/, '');
        if (!applyMeta(meta, dirCandidate, tmp, processor, path.dirname(compile_ini_path))){
            console.log('Операция компиляции прервана.');
            break;
        }
    }
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
                let tmp = fs.readFileSync(srcPath + '/'  + srcFile, 'utf8');
                if (file.source.hasOwnProperty('types') && file.source.types.hasOwnProperty(srcFile)){
                    for (const filetype of file.source.types[srcFile]){
                        if (processor.file.hasOwnProperty(filetype)){
                            const tmpFunc = processor.file[filetype];
                            const tmpType = typeof tmpFunc;
                            if (tmpType === 'string'){
                                fs.writeFileSync(tmpFile.name, tmp, 'utf8');
                                console.log(
                                        child_process.execSync(
                                            path.resolve(processorDirPath, tmpFunc) + ' ' + tmpFile.name
                                            )
                                        );
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
                            console.log(
                                    child_process.execSync(
                                        path.resolve(processorDirPath, tmpFunc) + ' ' + tmpFile.name
                                        )
                                    .toString()
                                    );
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
    if (bD){
        //fs.renameSync(tmpDestPath, destPath);
        fse.moveSync(tmpDestPath, destPath);//boris here: bug (пытается затереть содержимое целевой директории (надо не заместить её содержимое, а добавить))
                    //если и тогда будет пытаться переписать существующий файл(дир.-ю), должны аварийно прервать сборку с соответствующим сообщением
        for (const dirFuncId of meta.dir_proc){
            if (processor.dir.hasOwnProperty(dirFuncId)){
                const tmpFunc = processor.dir[dirFuncId];
                const tmpType = typeof tmpFunc;
                if (tmpType === 'string'){
                    console.log(child_process.execSync(path.resolve(processorDirPath, tmpFunc)));
                }
                else if (tmpType === 'function'){
                    tmpFunc(path.dirname(destPath), destPath.match(/([^\/])*$/g)[0]);
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
program.parse(process.argv);

