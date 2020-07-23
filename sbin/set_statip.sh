dnsmasq_conf=/tmp/dnsmasq.conf
staticIPEnable=`nv get staticIPEnable`
if [ $staticIPEnable = '1' ]; then
	index=0
	while [ $index -le 19 ]
	do
		tz_static_mac="tz_static_mac_$index"
		tz_static_ip="tz_static_ip_$index"
		mac_value=$(nv get $tz_static_mac)
		ip_value=$(nv get $tz_static_ip)
		if [ "x$mac_value" != "x" -a "x$ip_value" != "x" ]; then
			echo $mac_value
			echo $ip_value
			echo "dhcp-host=$mac_value,$ip_value,infinite" >> $dnsmasq_conf
		fi
		index=`expr $index + 1`
	done
fi
