{
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
}
