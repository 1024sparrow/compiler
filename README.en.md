# compiler
> Utility for projects building. Build rules can be written both either as JavaScript functions or as collection of scripts in any language(s) you prefer.
The program takes a parameter with path to 'compile.ini'.
The filename 'compile.ini' mentions conditionally - you can name such file with any filename. For example, I name such files as '<project_name>.pro'.
In directories with sources there's expecting to be files '__meta__'. If file __meta__ is missing, the directory will not compile.
Inside directories with __meta__ may be other, nesting subdirectories with another __meta__: at first will be processed nested __meta__, then the __meta__ of containing them directory.
## compile.ini:
Here define compile rules (string identifier and processing function on JavaScript (or path to processing script to be run instead)).
'compile.ini' recorded as a NodeJs module:
```js
module.exports = {
    target: 'compiled', // <-- here "compiler" will be put result to
    file_script_dir: '', //* relative path to derectory, regarding which paths to file processing scripts will be defined relatively. If this property missed, paths will be start from that directory, where is situated 'compile.ini'.
    file: {
        css:function(srcText){ // <-- files of type 'css' will be processed by this function. This function must return result as string.
        }
        // There's available point path to a script instead of JavaScript-function. That script must transform content in file, full path of which will be passed into the script by single parameter.
    },
    dir_script_dir: '', //* relative path to derectory, regarding which paths to directory processing scripts will be defined relatively. If this property missed, paths will be start from that directory, where is situated 'compile.ini'.
    dir: {
        tab_app:function(dirPath, dirName){ // <-- this function takes absolute path to directory, which contains target directory, and the target directory. This processor will be applyed to directories, marked as 'tab_app'.
        }
        // There's available point path to a script instead of JavaScript-function. That script takes two parameters - such as would be passed to the function (see above).
    }
}
```

## __meta__:
Здесь определяются цели компиляции, исходники и указываются идентификаторы обработчиков (из compile.ini).
Оформляется как JSON.
```js
{
    "files": [{..},{..}], //<-- Если это свойство есть, то собираем указанные файлы. Если этого свойства нет, то тупо копируем всю директорию.
    "dir_proc": ['..','..'] //<-- Перечень обработчиков, которые необходимо применить к результирующей директории. Если нужно сохранить директорию (т.е. результаты компиляции будут в такой же папке, а не положены вместо неё), то свойство должно быть, пусть в массиве и не будет элементов.
}
```
Формат описания правила компиляции файла (такой объект кладём в массив files):
```js
{
    "target": '..',//имя, не путь
    "type": ['..','..'],//* обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (постобработка, после формирования из составляющих)
    "source":{
        "list": ['1.js', '2.js'],
        "template": '..', //* путь до файла с шаблоном
        "types":{
            "1.js": ['..','..'] // обработчики файловые (текстовые идентификаторы из compile.ini), которые нужно применить (предобработка, перед вставкой в целевой файл)
        }
    }
}
// * - необязательное свойство
```

При написании шаблона как ссылаться на файлы-исходники:
{%% 1.js %%}
1.js - имя файла (не забудьте его прописать в __meta__ !). Между '%' и именем файла обязательно должен быть один пробел.

## Простейший файл __meta__:
```js
{
    "dir_proc": []
}
```
Что он делает - сохраняет директорию как есть. Если файл __meta__ отсутсвует или в нём нет свойства 'dir_proc', такой папки в результатах компиляции не будет.

## Установка
Для работы программы требуется NodeJS (версии не младше v6.11.0).
```sh
$ git clone https://github.com/1024sparrow/compiler.git
$ cd compiler
$ npm install
```
Ну вот и всё - теперь мы можете использовать compile.js в своей работе.
Если хотите поставить compile.js в систему, чтобы где бы вы не были, имели доступ к этой утилите, вам необходимо создать директорию (например, ~/opt/), где у вас будет лежать этот скрипт вместе с установленными зависимостями, и создать символическую ссылку ссылку на compile.js в /usr/local/bin/ :
```sh
$ cd <где_будут_лежать_у_вас_исходники>
$ git clone https://github.com/1024sparrow/compiler.git
$ cd compiler
$ npm install
$ sudo ln -s $(pwd)/compile.js /usr/local/bin/compile
```
Теперь в командной строке из любой директории вам доступна команда
```sh
$ compile --help
```
С ключом '--help' будет отображена справка по доступным ключам, а также будет выведена вся необходимая для работы информация.

См. также:
* [node-minify](https://www.npmjs.com/package/node-minify)
* [strip-comments](https://www.npmjs.com/package/strip-comments)

## Поддержка

Использование программы бесплатное. Вопросы, предложения, а также запросы на исправление ошибок программы, пожалуйста, оставляйте [здесь](https://github.com/1024sparrow/compiler/issues/new).

## Автор

**Васильев Борис**

* [github/1024sparrow](https://github.com/1024sparrow)

## Лицензия

Copyright © 2017 [Васильев Борис](https://github.com/1024sparrow)
Публикуется под лицензией [MIT license](https://github.com/1024sparrow/compiler/blob/master/LICENSE).

***
