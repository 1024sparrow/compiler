#!/bin/bash

for i in $*
do
	if [[ "-i" == "--help" ]]
	then
		echo "$(basename($0)) [--help] [<PATH_TO_ARCHIEVE_OR_TO_DIR_WITH_FILES>]
filename for archive file must be *.arch
"
		exit 0
	fi
done

function extract {
	echo "EXTRACTING..."
	local filepath="$1"
	local dirpath="$2"
	#echo "==== $filepath $dirpath"
	local tmpFile
	local tmp

	while IFS= read line
	do
		#echo "$line"
		if [[ "$line" =~ ^##.* ]]
		then
			#echo "comment: $line"
			echo -n "" > /dev/null
		elif [[ "$line" =~ ^#.* ]]
		then
			tmpFile="$dirpath"/"${line:2}"
			tmp=$(dirname "$tmpFile")
			if [ ! -d "$tmp" ]
			then
				mkdir -p "$tmp"
			fi
		else
			echo "$line" >> "$tmpFile"
		fi
	done < "$filepath"
	echo "done"
}

function empack {
	echo "EMPACKING..."
	local filepath="$1"
	local dirpath="$2"
	echo "==== $filepath $dirpath"
}

arch="$1"
declare -i mode=0 # 0 - undefined, 1 - file extracting, 2 - directory empacking

if [ -f "$1" ]
then
	mode=1
	filepath="$1"
	if [[ ! "$filepath" =~ \.arch$ ]]
	then
		echo "incorrect argument. See help."
		exit 1
	fi
	dirpath="${filepath%.arch}"
	#echo "Source file name: \"$filepath\""
	#echo "Target directory: \"$dirpath\""
	rm -rf "$dirpath"
	mkdir "$dirpath"
	extract "$filepath" "$dirpath"
elif [ -d "$1" ]
then
	mode=2
	dirpath="$1"
	filepath="$1".arch
	echo "Source file name: \"$filepath\""
	echo "Target directory: \"$dirpath\""
	rm -f "$filepath"
	empack "$filepath" "$dirpath"
else
	echo "Incorrect path. Check path or see help."
	exit 1
fi
