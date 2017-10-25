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
