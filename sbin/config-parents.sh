#!/bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: config-parents $1 $2 $3 start" >> $test_log

device()
{
	fname=$path_conf"/children_device_file"
	fbak=$path_conf"/children_device_file_bak"

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
}
white_site()
{
	fname=${path_conf}/white_site_file
	fbak=${path_conf}/white_site_file_bak
	if [ "x$1" = "x" ]; then
		echo "no action"
	elif [ "x$1" = "x-A" ]; then
		if [ "x$2" = "x" ]; then
			echo "no site to add"
		else #s2:site s3:name
			#sed -i "s%$2.*%%" $fname 
			#sed -i "/^$/d" $fname
			echo "$2,$3" >> $fname
			#cat $fbak > $fname
			#rm -f $fbak
		fi
	elif [ "x$1" = "x-D" ]; then
		if [ "x$2" = "x" ]; then
			echo "no site to delete"
		else #s2:ids
			ids=$2
			if [ -n "$ids" ]; then
				echo $ids|grep ",$"
				if [ 0 -eq $? ]; then
					echo "_____1"
					echo $ids|sed 's/\(,\)/d;/g'|sed 's%^\(.*\)%sed -i "\1"%'|sed "s,$, $fname,"|sh
				else
					echo "______2"
					echo $ids|sed 's/\(,\)/d;/g'|sed 's%^\(.*\)%sed -i "\1d"%'|sed "s,$, $fname," |sh
				fi
			fi
		fi
	else # $1 mac, $2 hostname
		echo "error action"
	fi
}

if [ "$1" = "white_site" ]; then
	white_site $2 $3 $4
elif [ "$1" = "device" ]; then
	device $2 $3
fi