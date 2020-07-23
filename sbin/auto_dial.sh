#!/bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh

echo "Info: auto_dial.sh $1 start" >> $test_log

wanlan_select()
{
	auto_wan_if=`nv get $1`
	ifconfig $auto_wan_if down 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $auto_wan_if down" >> $test_log
	fi
	ifconfig $auto_wan_if up 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $auto_wan_if up" >> $test_log
	fi
	(eth_auto_connect || echo "Error: eth_auto_connect failed." >> $test_log) &
}


wanlan_select $1
