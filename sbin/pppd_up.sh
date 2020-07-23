#!/bin/sh
#
# $Id: lan.sh
#
path_sh=`nv get path_sh`
. $path_sh/global.sh

pppd_auth=`nv get pppd_auth`
dev_name=$1
echo "name is $1"
aa=`echo $dev_name | sed 's/\//\\\\\//g'`
echo "aa is $aa"
echo "Info:start pppd!" >> $test_log
if [ "$pppd_auth" == "auth" ]; then
	cp $path_conf/options.auth $path_conf/options
	sed  -i -e "s/#dev_name#/$aa/g" $path_conf/options
	sed  -i -e "s/#dev_name#/$aa/g" $path_conf/options
	killall -9 pppd
	pppd &
elif [ "$pppd_auth" == "noauth" ]; then
	cp $path_conf/options.noauth $path_conf/options
	sed  -i -e "s/#dev_name#/$aa/g" $path_conf/options
	sed  -i -e "s/#dev_name#/$aa/g" $path_conf/options
	killall -9 pppd
	pppd &
fi
