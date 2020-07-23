#!/bin/sh

if [ "$1" = "" -o "$3" = "" ]; then
	echo "empty"
	return
fi

#grep -q "$1=" $3
result=$(cat $3 | grep "^$1=" | wc -l)
if [ $result -ne 0 ]; then
	echo "$1 exist"
	return
else
	sed -i "\$a $1=$2" $3
	nv set $1="$2" -s
fi
