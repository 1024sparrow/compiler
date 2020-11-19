{ // all functions take one parameter - ifHelp. If passed nonull value then just print help for this function.
	init: {%% init.js %%},
	add:{
		children:{
			source: {%% add_source.js %%},
			target: {%% add_target.js %%}
		}
	},
	rm:{
		children:{
			source: {%% rm_source.js %%},
			target: {%% rm_target.js %%}
		}
	},
	split: {%% split.js %%},
	join: {%% join.js %%},
	// mkdir // вынести цель в отдельную диреторию (когда в одном __meta__ несколько целей)
	/*
Допустим, мы создали файл (исходник), разбили его в попдиректорию. Затем добавили туда (в ту поддиреторию) ещё одну цель. Что теперь с этим делать? JOIN-ить не понятно как:
РЕШЕНИЕ: собираем несколько файлов (ровно так, как прописано __meta__ файле той диретории, которую мы схлопываем)
	*/
	help: true
}
