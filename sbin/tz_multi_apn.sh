#!/bin/sh
#set -x

if [ "-$2" == "-2" ]; then
	va_ipaddr=`nv get va0_ipaddr`
	va_netmask=`nv get va0_netmask`
	va_dhcpDns=`nv get va0_dhcpDns`
	multi_apn="multi_apn2"
	tz_apn_chain="tz_apn2"
	wlan0_va="wlan0-va0"
	nat_switch=`nv get main_nat_1`
elif [ "-$2" == "-3" ];then
	va_ipaddr=`nv get va1_ipaddr`
	va_netmask=`nv get va1_netmask`
	va_dhcpDns=`nv get va1_dhcpDns`
	multi_apn="multi_apn3"
	tz_apn_chain="tz_apn3"
	wlan0_va="wlan0-va1"
	nat_switch=`nv get main_nat_2`
elif [ "-$2" == "-1" ];then
	tz_apn_chain="tz_apn1"
	nat_switch=`nv get main_nat`
else
	exit 1
fi

apn_ip=`nv get wan$1_ip`
apn_gw=`nv get wan$1_gw`
apn_pridns=`nv get wan$1_pridns`
apn_secdns=`nv get wan$1_secdns`
wan_if=wan$1

get_net_segment()
{
    local cc=""
    for i in 1 2 3 4
    do
        aa=`expr $(echo $1 | cut -d '.' -f $i) \& $(echo $2 | cut -d '.' -f $i)`
        if [ -n "$cc" ]
        then
            cc="$cc.$aa"
        else
            cc="$aa"
        fi
    done
    echo "$cc"
}

mask_to_prefix() 
{
	local cc=""
	a=$(echo "$1" | awk -F "." '{print $1" "$2" "$3" "$4}')
	for num in $a
	do
		while [ $num != 0 ];do
			echo -n `expr $num % 2` >> /tmp/$$.num;
			num=`expr $num / 2`;
		done
	done
	cc=$(grep -o "1" /tmp/$$.num | wc -l)
	echo $cc
	rm /tmp/$$.num
}

change_dhcpconf()
{
	if [ "-$apn_pridns" != "-" -a "-$apn_secdns" != "-" ]; then
		sed -i "s/.*$wlan0_va,6.*/dhcp-option=$wlan0_va,6,${apn_pridns},${apn_secdns}/" /tmp/dnsmasq.conf
	elif [ "-$apn_pridns" != "-" ]; then
		sed -i "s/.*$wlan0_va,6.*/dhcp-option=$wlan0_va,6,${apn_pridns}/" /tmp/dnsmasq.conf
	elif [ "-$apn_secdns" != "-" ]; then
		sed -i "s/.*$wlan0_va,6.*/dhcp-option=$wlan0_va,6,${apn_secdns}/" /tmp/dnsmasq.conf
	else
		sed -i "s/.*$wlan0_va,6.*/dhcp-option=$wlan0_va,6,${va_dhcpDns}/" /tmp/dnsmasq.conf
	fi
	killall dnsmasq
	dnsmasq -C /tmp/dnsmasq.conf -r /etc_rw/dnsmasq.resolv.conf -K &
}

linkdown()
{
	#ifconfig $wan_if down
	ip rule del table $multi_apn
	iptables -t nat -F $tz_apn_chain
	change_dhcpconf
}

lan_ipaddr=`nv get lan_ipaddr`
lan_netmask=`nv get lan_netmask`
br0_segment=$(get_net_segment $lan_ipaddr $lan_netmask)
br0_prefix=$(mask_to_prefix $lan_netmask)

if [ $2 = "1" ]; then

	iptables -t nat -F $tz_apn_chain	
	if [ "$nat_switch" == "1" ]; then
		iptables -t nat -A $tz_apn_chain -s $br0_segment/$br0_prefix -o wan1 -j MASQUERADE
		#iptables -t nat -A $tz_apn_chain -s $br0_segment/$br0_prefix -o clat4 -j MASQUERADE
	fi

	exit
fi

va_segment=$(get_net_segment $va_ipaddr $va_netmask)
va_prefix=$(mask_to_prefix $va_netmask)

if [ $apn_ip == "" -o $apn_ip == "0.0.0.0" ]; then
	linkdown
	ip route flush cache
	exit 1
else
	linkdown
fi

#ifconfig $wan_if $apn_ip netmask 255.255.255.0
#ifconfig $wan_if up
ip rule add from $va_segment/$va_prefix table $multi_apn
ip route add $va_segment/$va_prefix dev $wlan0_va src $va_ipaddr table $multi_apn
ip route add default via $apn_ip dev $wan_if table $multi_apn
ip route flush cache
if [ "$nat_switch" == "1" ]; then
	iptables -t nat -A $tz_apn_chain -s $va_segment/$va_prefix -o $wan_if -j SNAT --to-source $apn_ip
fi
