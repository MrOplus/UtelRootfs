#!/bin/sh

#set -x

LAN_ROUTE_IP=$(nv get lan_ipaddr)
LAN_NETMASK=$(nv get lan_netmask)
NV_WANIP=$(nv get wan_ipaddr)
NV_ENABLE=$(nv get ip_postroute_enable)

WANIP=$(ifconfig wan1 | grep 'inet addr' | awk -F '[ :]+' '{print $4}')

if [ -z "$WANIP" ]; then
	if [ -z "$NV_WANIP" ] || [ "$NV_WANIP" = "0.0.0.0" ]; then
		exit
	else
		WANIP=${NV_WANIP}
	fi
fi

if [ "$NV_ENABLE" != "1" ]; then
	route del -host $WANIP dev br0
	route del default dev wan1
	echo "0" > /proc/sys/net/ipv4/conf/wan1/proxy_arp
	echo "0" > /proc/sys/net/ipv4/conf/br0/proxy_arp
	iptables -F -t nat
	exit
fi

ifconfig wan1 0.0.0.0 up

route del -host $WANIP dev br0
route del default dev wan1
route add -host $WANIP dev br0
route add default dev wan1

echo "1" > /proc/sys/net/ipv4/conf/wan1/proxy_arp
echo "1" > /proc/sys/net/ipv4/conf/br0/proxy_arp
iptables -F -t nat
iptables -t nat -I POSTROUTING -s $LAN_ROUTE_IP/$LAN_NETMASK -o wan1 -j SNAT --to-source $WANIP

set_udhcpd_config()
{
	killall -9 dnsmasq
	killall -9 udhcpd
	wan1_pridns=$(nv get wan1_pridns)
	wan1_secdns=$(nv get wan1_secdns)
	gatewayIP=$(echo "$WANIP" | awk 'BEGIN{FS=OFS="."}{$NF+=1;print}')
	
	#echo "interface br0" >> /tmp/udhcpd.conf
	echo "pidfile /tmp/udhcpd.pid" > /tmp/udhcpd.conf
	echo "option domain local" >> /tmp/udhcpd.conf
	echo "start $WANIP" >> /tmp/udhcpd.conf
	echo "end $WANIP" >> /tmp/udhcpd.conf
	echo "interface br0" >> /tmp/udhcpd.conf
	echo "opt router $gatewayIP" >> /tmp/udhcpd.conf
	if [ "-$wan1_pridns" != "-" -a "-$wan1_secdns" != "-" ]; then
		echo "option dns ${wan1_pridns}" >> /tmp/udhcpd.conf
		echo "option dns ${wan1_secdns}" >> /tmp/udhcpd.conf
	elif [ "-$wan1_pridns" != "-" ]; then
		echo "option dns ${wan1_pridns}" >> /tmp/udhcpd.conf
		echo "option dns 8.8.8.8" >> /tmp/udhcpd.conf
	elif [ "-$wan1_secdns" != "-" ]; then
		echo "option dns ${wan1_secdns}" >> /tmp/udhcpd.conf
		echo "option dns 8.8.8.8" >> /tmp/udhcpd.conf
	else
		echo "option dns 8.8.8.8" >> /tmp/udhcpd.conf
	fi

	echo "option subnet 255.255.255.0" >> /tmp/udhcpd.conf
	echo "option lease 86400" >> /tmp/udhcpd.conf
	echo "lease_file /tmp/udhcpd.leases" >> /tmp/udhcpd.conf

	udhcpd /tmp/udhcpd.conf &
}

set_udhcpd_config
