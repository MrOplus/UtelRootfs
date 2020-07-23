#!/bin/sh

path_conf=`nv get path_conf`
test_log=`nv get path_log`
dnsmasq_conf=/tmp/dnsmasq.conf
dnsmasq_resolv_conf=$path_conf/dnsmasq.resolv.conf
TZ_MULTIDHCP_ENABLE=`nv get tz_multidhcp_enable`
TZ_DHCP2_ENABLE=`nv get tz_dhcp2_enable`
TZ_DHCP3_ENABLE=`nv get tz_dhcp3_enable`
TZ_IPPASS_ENABLE=$(nv get ip_postroute_enable)
SIM_STATUS=$(nv get modem_main_state)
if [ "$TZ_IPPASS_ENABLE" == "1" -a "-$SIM_STATUS" != "-modem_sim_undetected" ]; then
	exit 0
fi

lan_set()
{
    local ip=`nv get lan_ipaddr`
    local nm=`nv get lan_netmask`
    local lan_if=`nv get lan_name`
    ifconfig $lan_if $ip netmask $nm 2>>$test_log
    if [ $? -ne 0 ];then
        echo "Error: ifconfig $lan_if $ip netmask $nm failed." >> $test_log
    fi
}

set_dhcp_config()
{
	local dhcpDns=`nv get dhcpDns`
    local dhcpStart=`nv g dhcpStart`
    local dhcpEnd=`nv g dhcpEnd`
	local dhcpLease_hour=`nv g dhcpLease_hour`
    local dhcpLease=`expr $dhcpLease_hour \* 3600`
    local lan_netmask=`nv g lan_netmask`
	echo "dhcp-option=option:dns-server,${dhcpDns}" >> $dnsmasq_conf
    echo "dhcp-range=${dhcpStart},${dhcpEnd},${lan_netmask},${dhcpLease}" >> $dnsmasq_conf
}

set_multidhcp_config()
{
	local va0_ipaddr=`nv get va0_ipaddr`
	local va0_dhcpDns=`nv get va0_dhcpDns`
    	local va0_dhcpStart=`nv g va0_dhcpStart`
	local va0_dhcpEnd=`nv g va0_dhcpEnd`
	local va0_netmask=`nv g va0_netmask`
	local va0_dhcpLease=`nv g va0_dhcpLease`
	local apn2_pridns=`nv get wan3_pridns`
	local apn2_secdns=`nv get wan3_secdns`
	if [ "$TZ_DHCP2_ENABLE" == "1" ]; then
		echo "interface=wlan0-va0" >> $dnsmasq_conf
    		echo "dhcp-option=wlan0-va0,3,${va0_ipaddr}" >> $dnsmasq_conf
		if [ "-${va0_dhcpDns}" != "-" ]; then
			echo "dhcp-option=wlan0-va0,6,${va0_dhcpDns}" >> $dnsmasq_conf
		elif [ "-$apn2_pridns" != "-" -a "-$apn2_secdns" != "-" ]; then
			echo "dhcp-option=wlan0-va0,6,${apn2_pridns},${apn2_secdns}" >> $dnsmasq_conf
		elif [ "-$apn2_pridns" != "-" ]; then
			echo "dhcp-option=wlan0-va0,6,${apn2_pridns}" >> $dnsmasq_conf
		elif [ "-$apn2_secdns" != "-" ]; then
			echo "dhcp-option=wlan0-va0,6,${apn2_secdns}" >> $dnsmasq_conf
		else
			echo "dhcp-option=wlan0-va0,6,${va0_ipaddr}" >> $dnsmasq_conf
		fi
		echo "dhcp-range=wlan0-va0,${va0_dhcpStart},${va0_dhcpEnd},${va0_netmask},${va0_dhcpLease}" >> $dnsmasq_conf
		#echo "dhcp-range=wlan0-va0,192.168.6.100,192.168.6.200,255.255.255.0,${dhcpLease}" >> $dnsmasq_conf
		#ifconfig wlan0-va0 $va0_ipaddr netmask $va0_netmask 2>>$test_log
		#if [ $? -ne 0 ];then
		#	echo "Error: ifconfig wlan0-va0 $va0_ipaddr netmask $va0_netmask failed." >> $test_log
		#fi
	fi

	local va1_ipaddr=`nv get va1_ipaddr`
	local va1_dhcpDns=`nv get va1_dhcpDns`
    	local va1_dhcpStart=`nv get va1_dhcpStart`
	local va1_dhcpEnd=`nv get va1_dhcpEnd`
	local va1_dhcpLease=`nv get va1_dhcpLease`
	local va1_netmask=`nv get va1_netmask`
	local apn3_pridns=`nv get wan4_pridns`
	local apn3_secdns=`nv get wan4_secdns`
	if [ "$TZ_DHCP3_ENABLE" == "1" ]; then
		echo "interface=wlan0-va1" >> $dnsmasq_conf
    		echo "dhcp-option=wlan0-va1,3,${va1_ipaddr}" >> $dnsmasq_conf
		if [ "-${va1_dhcpDns}" != "-" ]; then
			echo "dhcp-option=wlan0-va1,6,${va1_dhcpDns}" >> $dnsmasq_conf
		elif [ "-$apn3_pridns" != "-" -a "-$apn3_secdns" != "-" ]; then
			echo "dhcp-option=wlan0-va1,6,${apn3_pridns},${apn3_secdns}" >> $dnsmasq_conf
		elif [ "-$apn3_pridns" != "-" ]; then
			echo "dhcp-option=wlan0-va1,6,${apn3_pridns}" >> $dnsmasq_conf
		elif [ "-$apn3_secdns" != "-" ]; then
			echo "dhcp-option=wlan0-va1,6,${apn3_secdns}" >> $dnsmasq_conf
		else
			echo "dhcp-option=wlan0-va1,6,${va1_ipaddr}" >> $dnsmasq_conf
		fi
		echo "dhcp-range=wlan0-va1,${va1_dhcpStart},${va1_dhcpEnd},${va1_netmask},${va1_dhcpLease}" >> $dnsmasq_conf
		#ifconfig wlan0-va1 $va1_ipaddr netmask $va1_netmask 2>>$test_log
		#if [ $? -ne 0 ];then
		#	echo "Error: ifconfig wlan0-va1 $va1_ipaddr netmask $va1_netmask failed." >> $test_log
		#fi
	fi
}

sed -i '/^dhcp-range/d' $dnsmasq_conf
sed -i '/^dhcp-leasefile/d' $dnsmasq_conf
dhcp=`nv get dhcpEnabled`
if [ "$dhcp" == "1" ]; then
    set_dhcp_config
fi

if [ "$TZ_MULTIDHCP_ENABLE" == "1" ]; then
    set_multidhcp_config
fi

lan_set

sh /sbin/set_statip.sh
echo "dhcp-leasefile=/tmp/dnsmasq.leases" >> $dnsmasq_conf
killall -9 dnsmasq
dnsmasq -C $dnsmasq_conf -r $dnsmasq_resolv_conf -K &
