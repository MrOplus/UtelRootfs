#!/bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: config-hostname.sh $1 $2 start" >> $test_log
fname=$path_conf"/hostname_mac_file"
fbak=$path_conf"/hostname_mac_file_bak"

if [ "x$1" = "x" ]; then
    echo "insufficient arguments.."
elif [ "x$2" = "x" ]; then
    sed -e "/$1/d" $fname > $fbak
	cat $fbak > $fname
    rm -f $fbak
else # $1 mac, $2 hostname
    sed -e "/$1/d" $fname > $fbak
    echo "$1 $2" >> $fbak
	cat $fbak > $fname
    rm -f $fbak
fi


