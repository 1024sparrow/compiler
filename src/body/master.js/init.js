function(){
`
project/
  src/
    pro
    __meta__
   ...
  compiled/


project/
  some_compiled_1
  some_compiled_2
  src/
    pro
    __meta__
    ...
`;
	if (fs.existsSync('pro')){
		console.log('File \"pro\" already exists');
		process.exit(1);
	}
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question('Where build into: ',function(p_reply){
		console.log(p_reply);
		rl.close();
	});
	var pro = `module.exports = {
	target: '../compiled'
}`;
	//fs.writeFileSync('pro', '', 'utf8');
}
