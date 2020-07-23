#!/bin/sh
#
# $Id: pppoe_dail.sh,v 1.1 2007-09-26 01:33:21 winfred Exp $
#
# usage: pppoe_dail.sh
#
# pppoe_dail.sh,v1.0 2010-09-09 10:00:00 maxiaoliang  $
#
# usage: pppoe_dail.sh
#
path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: pppoe_dail.sh start " >> $test_log

usage()
{
        echo "Usage:"
        echo "  $0 [connect | disconnect]"
        exit 1
}
if [ "$1" = "" ]; then
        echo "$0: insufficient arguments"
        usage $0
fi

killall pppoecd
 
eth_dial_mode=`nv get ethwan_dialmode`

idle_time=`nv get idle_time`
wan0=`nv get ethwan` 

 	if [ "$1" = "connect" ]; then
		pppoe_user=`nv get pppoe_username`
		pppoe_pass=`nv get pppoe_password`
    	if [ "-${pppoe_user}" = "-" -a "-${pppoe_pass}" = "-" ];then
		    echo "WARN: pppoe_user is ${pppoe_user}, pppoe_pass is ${pppoe_pass}, so not connect pppoecd. " >> $test_log
		else
		#dial mode
		if [ "$eth_dial_mode" == "auto" ]; then 
			pppoecd $wan0  -u $pppoe_user -p $pppoe_pass -N 2 -k &
		elif [ "$eth_dial_mode" == "ondemand" ]; then 
			pppoecd $wan0  -u $pppoe_user -p $pppoe_pass -N 2 -i $idle_time -R -k &
		elif [ "$eth_dial_mode" == "manual" ]; then 
			pppoecd $wan0  -u $pppoe_user -p $pppoe_pass -N 2 -k &
		fi
	fi
	fi
		
	if [ "$1" = "disconnect" ]; then
		echo "pppoe-down:   pppoe is disconnected! "
		sleep 2
	fi
 
