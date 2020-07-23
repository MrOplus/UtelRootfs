#!/bin/sh
#
# $Id: nat.sh,v 1.4 2009-12-09 08:45:37 steven Exp $
#
# usage: nat.sh
#

path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: nat.sh start " >> $test_log

ZTE_FORWARD_CHAIN=port_forward
ZTE_DMZ_CHAIN=DMZ
ZTE_MAPPING_CHAIN=port_mapping
TZ_APN1_CHAIN=tz_apn1
TZ_APN2_CHAIN=tz_apn2
TZ_APN3_CHAIN=tz_apn3

iptables -P INPUT ACCEPT
iptables -P OUTPUT ACCEPT
iptables -P FORWARD ACCEPT

#clear nat
iptables -t nat -F
iptables -t nat -X $ZTE_FORWARD_CHAIN
iptables -t nat -X $ZTE_DMZ_CHAIN
iptables -t nat -X $ZTE_MAPPING_CHAIN
iptables -t nat -X $TZ_APN1_CHAIN
iptables -t nat -X $TZ_APN2_CHAIN
iptables -t nat -X $TZ_APN3_CHAIN

#Make a new chain for nat
iptables -t nat -N $ZTE_FORWARD_CHAIN
iptables -t nat -N $ZTE_DMZ_CHAIN
iptables -t nat -N $ZTE_MAPPING_CHAIN
iptables -t nat -N $TZ_APN1_CHAIN
iptables -t nat -N $TZ_APN2_CHAIN
iptables -t nat -N $TZ_APN3_CHAIN

iptables -t nat -A POSTROUTING -j $TZ_APN1_CHAIN
iptables -t nat -A POSTROUTING -j $TZ_APN2_CHAIN
iptables -t nat -A POSTROUTING -j $TZ_APN3_CHAIN
iptables -t nat -I PREROUTING 1 -j $ZTE_FORWARD_CHAIN
iptables -t nat -I PREROUTING 1 -j $ZTE_DMZ_CHAIN
iptables -t nat -I PREROUTING 1 -j $ZTE_MAPPING_CHAIN

lan_en=`nv get LanEnable`
nat_en=`nv get natenable`
if [ "-$nat_en" != "-0" -a "-$lan_en" == "-2" ]; then
    iptables -t nat -A $TZ_APN1_CHAIN -o ${defwan_rel%:*} -j MASQUERADE
elif [ "-$nat_en" != "-0" -a "-$lan_en" != "-0" ]; then
	iptables -t nat -A $TZ_APN1_CHAIN -o $defwan_rel -j MASQUERADE
fi

#clat46_en=1
#if [ "-$clat46_en" = "-1" ]; then
#	iptables -t nat -A POSTROUTING -o clat4 -j MASQUERADE
#fi
  
multiapn_en=`nv get tz_multiapn_enable`
apn2_en=`nv get tz_apn2_enable`
apn2_cid=`nv get tz_apn2_cid`
apn3_en=`nv get tz_apn3_enable`
apn3_cid=`nv get tz_apn3_cid`
voipapn_en=`nv get voip_apn_enable`
if [ "-$multiapn_en" == "-1" -o "-$voipapn_en" == "-1" ]; then
	
	iptables -t nat -D POSTROUTING -o wan1 -j MASQUERADE
	#iptables -t nat -D POSTROUTING -o clat4 -j MASQUERADE

	sh /sbin/tz_multi_apn.sh 1 1

	if [ "-$apn2_en" == "-1" ]; then
		sh /sbin/tz_multi_apn.sh $apn2_cid 2
	fi
	
	if [ "-$apn3_en" == "-1" -a "-$voipapn_en" != "-1" ]; then
		sh /sbin/tz_multi_apn.sh $apn3_cid 3
	fi
	
fi

/etc/rc.d/rc.iptables_filter &
