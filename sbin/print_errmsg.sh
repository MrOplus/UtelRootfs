#!/bin/sh

echo "error:"
grep "\<${1##0}\>" /etc_ro/errmsg.txt|sed -n "s/#define[[:blank:]]\+[a-zA-Z0-9]\+[[:blank:]]\+[0-9]\+[[:blank:]]\+\(.*\)/\1/p" |awk -F'*' '{print $2}'
