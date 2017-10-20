#!/usr/bin/node

var compressor = require('node-minify');
var fs = require('fs');

var filepath = process.argv[2];
var filepathTmp = filepath + '.tmp';
compressor.minify({
    compressor: 'yui-js',
    input: filepath,
    output: filepathTmp,
    options:{
        charset: 'utf8'
    },
    callback: function(err, min){
        if (err)
            console.log(err);
        else{
            fs.renameSync(filepathTmp, filepath);
        }
    }
});
