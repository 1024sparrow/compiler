#!/bin/bash

for i in $*
do
	if [[ "$i" == "--help" ]]
	then
		tmp=$(basename "$0")
		echo "$tmp [--help] [<PATH_TO_ARCHIEVE_OR_TO_DIR_WITH_FILES>]
filename for archive file must be *.arch
Пример содержимого файла *.arch:
## Две решётки в начале строки - комментарий
## Одна решётка - указание пути до файла
# src/pro

module.exports = {
	target: '../compiled'
}

# src/__meta__
asd
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
	local tmpDir
	local tmpFile
	local tmp
	#echo "==== $filepath $dirpath"
	while read line
	do
		#echo "\"$line\""
		if [[ "$line" =~ .*:$ ]]
		then
			tmpDir="${line:0:-1}"
			#echo "dir: \"$tmpDir\""
		else
			tmpFile="$tmpDir"/"$line"
			if [ -f "$tmpFile" ]
			then
				#echo "file: \"$tmpFile\""
				tmp=$((${#dirpath}+1))
				echo "# ${tmpFile:$tmp}" >> "$filepath"
				while IFS= read textLine
				do
					echo "$textLine" >> "$filepath"
				done < "$tmpFile"
			fi
		fi
	done < <(ls "$dirpath" -R -1)
	echo "done"
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
	#echo "Source file name: \"$filepath\""
	#echo "Target directory: \"$dirpath\""
	rm -f "$filepath"
	empack "$filepath" "$dirpath"
else
	echo "Incorrect path. Check path or see help."
	exit 1
fi
