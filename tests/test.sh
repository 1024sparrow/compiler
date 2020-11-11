#!/bin/bash

#./archiever.sh ../1.arch

tmp=$(dirname "$0")
pushd "$tmp" > /dev/null

pushd src > /dev/null
for i in $(ls *.pro -1)
do
	i="${i:0:-4}"
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
			rm "$i"_compiled.arch
		fi
	fi
	rm -rf "$i"_compiled
done
popd > /dev/null

popd > /dev/null
