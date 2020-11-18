#!/bin/bash

#./archiever.sh ../1.arch

tmp=$(dirname "$0")
pushd "$tmp" > /dev/null

pushd core > /dev/null
testsPassed=true
testList="$1"
testListSet=true
if [ -z "$testList" ]
then
	testList=$(ls *.pro -1)
	testListSet=false
fi
for i in $testList
do
	if ! $testListSet
	then
		i="${i:0:-4}"
	fi
	../archiever.sh "$i".arch
	mv "$i" "$i"_compiled
	tmp=$(cat "$i".pro)
	if ../../compile.js "$i"_compiled/"$tmp"
	then
		../archiever.sh "$i"_compiled
		tmp1=$(md5sum "$i"_compiled.arch)
		tmp2=$(md5sum "$i"_expected_result.arch)
		if [[ ! "${tmp1:0:32}" == "${tmp2:0:32}" ]]
		then
			echo "NOT THE SAME"
			vimdiff "$i"_expected_result.arch "$i"_compiled.arch
			testsPassed=false
		fi
		rm "$i"_compiled.arch
	else
		testsPassed=false
	fi
	if ! $ok
	then
		testsPassed=false
	fi
	rm -rf "$i"_compiled
done
if $testsPassed
then
	echo "all tests for compiler's core passed successfully"
else
	echo "tests for compiler's core not passed because of some errors"
fi
popd > /dev/null

popd > /dev/null
