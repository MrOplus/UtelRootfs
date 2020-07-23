#!/bin/sh 

path_sh=`nv get path_sh`
. $path_sh/global.sh

echo "Info: clat_config.sh $1 $2 start" >> $test_log

if [ "x$2" != "x" ]; then
	wan1_ipv6_prefix_info=`nv get $2"_ipv6_prefix_info"`
fi

if [ "x$wan1_ipv6_prefix_info" != "x" ]; then
    clat6_ipv6="$wan1_ipv6_prefix_info"":464"
fi

ipv4_fake_subnet=`nv get ipv4_fake_subnet`
clat_fake_subnet=`nv get clat_fake_subnet`
ipv6_fake_addr=`nv get ipv6_fake_subnet`
if [ "x$ipv6_fake_addr" != "x" ];then
	ipv6_fake_subnet=$ipv6_fake_addr"/64"
fi

case $1 in 
 "up") 
    if [ "x$ipv4_fake_subnet" == "x" -a "x$clat_fake_subnet" == "x" -a "x$ipv6_fake_addr" == "x" ];then
        echo "Info: ipv4_fake_subnet and clat_fake_subnet not exist, please check!!!" >> $test_log
    fi

	# for 46
	route add default dev clat4 metric 40
    route add -net $ipv4_fake_subnet netmask 255.255.0.0 dev clat4
	iptables -t nat -A POSTROUTING -o clat4 -j MASQUERADE
	
	if [ "x$clat6_ipv6" != "x" -a "x$2" != "x" ]; then
		ip -6 neigh add proxy $clat6_ipv6 dev $2
	fi
	
	echo 1 > /proc/sys/net/ipv4/ip_forward
	
	#for 64
	#ip -6 route add $ipv6_fake_subnet dev clat
	#route add -net $clat_fake_subnet netmask 255.255.255.0 dev clat4
    ;;
 
 "down") 
	
	# for 46
	route del default dev clat4 metric 40
    route del -net $ipv4_fake_subnet netmask 255.255.0.0 dev clat4
	iptables -t nat -D POSTROUTING -o clat4 -j MASQUERADE
	
	if [ "x$clat6_ipv6" != "x" -a "x$2" != "x" ]; then
		ip -6 neigh del proxy $clat6_ipv6 dev $2
	fi
	
	#for 64
	#ip -6 route del $ipv6_fake_subnet dev clat
	#route del -net $clat_fake_subnet netmask 255.255.255.0 dev clat4
    ;;

esac


