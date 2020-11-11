#!/bin/bash

#./archiever.sh ../1.arch

tmp=$(dirname "$0")
pushd "$tmp" > /dev/null

pushd src > /dev/null
for i in 1
do
	../archiever.sh "$i".arch
	mv "$i" "$i"_compiled
	tmp=$(cat "$i".pro)
	ok=false
	../../compile.js "$i"_compiled/"$tmp" && ../archiever.sh "$i"_compiled && ok=true
	if $ok
	then
		if [[ ! $(cat "$i"_compiled.arch) == $(cat "$i"_expected_result.arch) ]]
		then
			echo "NOT THE SAME"
			vimdiff "$i"_compiled.arch "$i"_expected_result.arch
		fi
	fi
	rm "$i"_compiled.arch
	rm -rf "$i"_compiled
done
popd > /dev/null

popd > /dev/null
