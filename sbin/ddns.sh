#!/bin/sh
#
# $Id: ddns.sh,v 1.1 2018-1-24 15:12:52 winfred Exp $
#
# usage: ddns.sh
#
path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: ddns.sh start" >> $test_log

srv=`nv get DDNSProvider`
ddns=`nv get DDNS`
ddns_hash=`nv get DDNS_Hash_Value`
u=`nv get DDNSAccount`
pw=`nv get DDNSPassword`
ddns_enable=`nv get DDNS_Enable`

killall -q yaddns
rm -rf /tmp/noip_login_status

if [ "x$ddns_enable" = "x0" ]; then
	exit 0
fi
if [ "x$srv" = "x" -o "x$srv" = "xnone" ]; then
	exit 0
fi
if [ "x$ddns" = "x" -o "x$u" = "x" -o "x$pw" = "x" ]; then
	exit 0
fi
yaddns -f /etc/yaddns.conf &
exit 0
# debug
if [ "x" = "x0" ]; then
	echo "srv=$srv"
	echo "ddns=$ddns"
	echo "ddns_hash=$ddns_hash"
	echo "u=$u"
	echo "pw=$pw"


	if [ "x$srv" = "xdyndns.org" ]; then
		inadyn -u $u -p $pw -a $ddns --dyndns_system dyndns@$srv &
	elif [ "x$srv" = "xfreedns.afraid.org" ]; then
		inadyn -u $u -p $pw -a $ddns,$ddns_hash --dyndns_system default@$srv &
	elif [ "x$srv" = "xzoneedit.com" ]; then
		inadyn -u $u -p $pw -a $ddns --dyndns_system default@$srv &
	elif [ "x$srv" = "xno-ip.com" ]; then
		inadyn -u $u -p $pw -a $ddns --dyndns_system default@$srv &
	else
		inadyn -u $u -p $pw -a $ddns --dyndns_system default@$srv &
		echo "unknown DDNS provider: $srv"
	fi
fi
