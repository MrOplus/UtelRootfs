#!/bin/sh
#set -x

if [ "-$2" == "-2" ]; then
	multi_apn="multi_apn2"
elif [ "-$2" == "-3" ];then
	multi_apn="multi_apn3"
else
	exit 1
fi

apn_gw=`nv get wan$1_gw`
apn_ip=`nv get wan$1_ip`
wan_if=wan$1

linkdown()
{
	ip route flush table $multi_apn
	ip rule del table $multi_apn
}

if [ $apn_gw == "" -o $apn_gw == "0.0.0.0" ]; then
	linkdown
	ip route flush cache
	exit 1
else
	linkdown
fi

ip rule add from $apn_ip table $multi_apn
ip route add default via $apn_gw dev $wan_if table $multi_apn
ip route flush cache
nv set voip_apn_init_ok=1
