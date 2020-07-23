#!/bin/sh
# Created by LiuWei @ 2010.8.27 
# init firewall
#

path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: firewall_init.sh start" >> $test_log


ZTE_FILTER_CHAIN=macipport_filter
ZTE_WEB_FILTER_CHAIN=web_filter
ZTE_CLILDREN_CHAIN=children_filter
ZTE_CLILDREN_WEB_CHAIN=children_web_filter
ZTE_CLILDREN_WEB_PHONECHAIN=children_web_filter_phone
TZ_SYN_FLOOD_CHAIN=syn_flood
TZ_WAN_ICMP_CHAIN=wan_icmp
TZ_ACL_CHAIN=tz_acl
TZ_RATELIMIT_CHAIN=tz_ratelimit
TZ_TRAFFIC_SHARE=tz_traffic_share

#clear filter
iptables -t filter -F
iptables -t filter -X $ZTE_FILTER_CHAIN
iptables -t filter -X $ZTE_WEB_FILTER_CHAIN
iptables -t filter -X $ZTE_CLILDREN_CHAIN
iptables -t filter -X $ZTE_CLILDREN_WEB_CHAIN
iptables -t filter -X $ZTE_CLILDREN_WEB_PHONECHAIN
iptables -t filter -X $TZ_SYN_FLOOD_CHAIN
iptables -t filter -X $TZ_WAN_ICMP_CHAIN
iptables -t filter -X $TZ_ACL_CHAIN
iptables -t filter -X $TZ_RATELIMIT_CHAIN
iptables -t filter -X $TZ_TRAFFIC_SHARE

ip6tables -t filter -F
ip6tables -t filter -X $ZTE_FILTER_CHAIN 
ip6tables -t filter -X $TZ_ACL_CHAIN
ip6tables -t filter -X $ZTE_WEB_FILTER_CHAIN
#make a new chain for filter
iptables -t filter -N $ZTE_FILTER_CHAIN
iptables -t filter -N $ZTE_WEB_FILTER_CHAIN
iptables -t filter -N $ZTE_CLILDREN_CHAIN
iptables -t filter -N $ZTE_CLILDREN_WEB_CHAIN
iptables -t filter -N $ZTE_CLILDREN_WEB_PHONECHAIN
iptables -t filter -N $TZ_SYN_FLOOD_CHAIN
iptables -t filter -N $TZ_WAN_ICMP_CHAIN
iptables -t filter -N $TZ_ACL_CHAIN
iptables -t filter -N $TZ_RATELIMIT_CHAIN
iptables -t filter -N $TZ_TRAFFIC_SHARE
ip6tables -t filter -N $ZTE_WEB_FILTER_CHAIN
ip6tables -t filter -N $ZTE_FILTER_CHAIN 
ip6tables -t filter -N $TZ_ACL_CHAIN

DDOS_STATUS=`nv get tz_ddos_status`
if [ "1" = $DDOS_STATUS ] ;
then
iptables -A $TZ_SYN_FLOOD_CHAIN -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -m limit --limit 25/sec --limit-burst 50 -j RETURN
iptables -A $TZ_SYN_FLOOD_CHAIN -j DROP
else
iptables -F $TZ_SYN_FLOOD_CHAIN
fi


#iptables -A $TZ_WAN_ICMP_CHAIN -p icmp --icmp-type echo-request -i $defwan_rel -j DROP

iptables -t filter -A FORWARD -j $ZTE_WEB_FILTER_CHAIN
iptables -t filter -A FORWARD -j $TZ_RATELIMIT_CHAIN
iptables -t filter -A FORWARD -j $ZTE_FILTER_CHAIN
iptables -t filter -A FORWARD -j $ZTE_CLILDREN_CHAIN
iptables -t filter -A INPUT -j $TZ_SYN_FLOOD_CHAIN
iptables -t filter -A INPUT -j $TZ_WAN_ICMP_CHAIN
iptables -t filter -A INPUT -j $ZTE_CLILDREN_WEB_CHAIN
iptables -t filter -A FORWARD -j $ZTE_CLILDREN_WEB_PHONECHAIN
iptables -t filter -A INPUT -j $TZ_ACL_CHAIN
iptables -t filter -A FORWARD -j $TZ_TRAFFIC_SHARE

ip6tables -t filter -A FORWARD -j $ZTE_WEB_FILTER_CHAIN
ip6tables -t filter -A FORWARD -j $ZTE_FILTER_CHAIN
ip6tables -t filter -A $ZTE_FILTER_CHAIN -m state --state RELATED,ESTABLISHED -j ACCEPT
ip6tables -t filter -A INPUT -j $TZ_ACL_CHAIN

#Close unused port
iptables -t filter -A INPUT -i $defwan_rel --dport 22 -j DROP
iptables -t filter -A INPUT -i $defwan_rel --dport 23 -j DROP
#iptables -t filter -A INPUT -i $defwan_rel --dport 80 -j DROP
iptables -t filter -A INPUT -i $defwan_rel -p udp --dport 53 -j DROP
iptables -t filter -A INPUT -i $defwan_rel -p tcp --dport 53 -j DROP
iptables -t filter -A INPUT -p tcp --dport 7777 -j DROP
iptables -t filter -A INPUT -p udp --dport 7777 -j DROP
iptables -t filter -I INPUT -i $defwan_rel -p icmp --icmp-type echo-reply -j ACCEPT

permit_gw=`nv get permit_gw`
permit_nm=`nv get permit_nm`
if [ "-${permit_gw}" != "-" ]; then
	iptables -A FORWARD -o $defwan_rel -d $permit_gw/$permit_nm -j ACCEPT
	iptables -A FORWARD -o $defwan_rel -j DROP
	iptables -A OUTPUT -o $defwan_rel -d $permit_gw/$permit_nm -j ACCEPT
	iptables -A OUTPUT -o $defwan_rel -j DROP
fi

permit_ip6=`nv get permit_ip6`
if [ "-${permit_ip6}" != "-" ]; then
	ip6tables -A FORWARD -o $defwan6_rel -d $permit_ip6 -j ACCEPT
	ip6tables -A FORWARD -o $defwan6_rel -j DROP
	ip6tables -A OUTPUT -o $defwan6_rel -d $permit_ip6 -j ACCEPT
	ip6tables -A OUTPUT -o $defwan6_rel -j DROP
fi


if [ "-$defwan_rel" == "-ppp0" ]; then
	mtu=`nv get mtu`
	pppoe_mtu=`expr $mtu - 60`
	iptables -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss $pppoe_mtu
else
	iptables -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
fi
# firewall will flush nat and filter, so upnp should run after it.
#sh $path_sh/upnp.sh

