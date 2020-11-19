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
	join: {%% join.js %%}
	/*
Допустим, мы создали файл (исходник), разбили его в попдиректорию. Затем добавили туда (в ту поддиреторию) ещё одну цель. Что теперь с этим делать? JOIN-ить не понятно как:
РЕШЕНИЕ: собираем несколько файлов (ровно так, как прописано __meta__ файле той диретории, которую мы схлопываем)
	*/

	// mergeDirs - join some subdirectories into one subdirectory with some targets in the same __meta__. Может быть полезно в случае, когда разные цели используют общие исходники.
	// splitDirs - for subdirectory create separated subdirectory for each target
}
