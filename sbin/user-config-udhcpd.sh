#!/bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: user-config-udhcpd.sh start" >> $test_log

lan_enable=`nv get LanEnable`
if [ "-$lan_enable" == "-0" ]; then
    exit 0
fi

static_ip_init()
{
	mac_ip_list=`nv get mac_ip_list`
	num_any=`echo $mac_ip_list| grep -c ";"`
	num_one=`echo $mac_ip_list| grep -c "+"`

	if [ "$num_any" -eq "0" ]; then
		if [ "$num_one" -eq "1" ]; then
			mac=`echo $mac_ip_list| awk -F '+' '{print $2}'`
			ip=`echo $mac_ip_list| awk -F '+' '{print $3}'`
			sh $path_sh/config-udhcpd.sh "lan" -S $mac $ip
		else
			echo "the mac_ip_list is null"
		
		fi		
	else
		var=`echo $mac_ip_list | sed "s/;/ /g"`
		for list in $var
		do
			mac=`echo $list| awk -F '+' '{print $2}'`
			ip=`echo $list| awk -F '+' '{print $3}'`
			sh $path_sh/config-udhcpd.sh "lan" -S $mac $ip
		done

	fi
}

start=`nv get dhcpStart`
end=`nv get dhcpEnd`
dns=`nv get dhcpDns`
mask=`nv get lan_netmask`
gw=`nv get lan_ipaddr`
lease=`nv get dhcpLease_hour`
lease=`expr $lease \* 3600`
pidfile=$path_conf"/udhcpd.pid"
leasesfile=$path_conf"/udhcpd.leases"

sh $path_sh/config-udhcpd.sh "lan" -s $start
sh $path_sh/config-udhcpd.sh "lan" -e $end
sh $path_sh/config-udhcpd.sh "lan" -i $lan_if
sh $path_sh/config-udhcpd.sh "lan" -m $mask
sh $path_sh/config-udhcpd.sh "lan" -d $dns
echo "Info: config-udhcpd.sh lan -d $dns" >> $test_log
if [ "-$gw" != "-" ]; then
    sh $path_sh/config-udhcpd.sh "lan" -g $gw
	echo "Info: config-udhcpd.sh lan -g $gw" >> $test_log
fi
if [ "-$lease" != "-" ]; then
    sh $path_sh/config-udhcpd.sh "lan" -t $lease
fi

static_ip_init

sh $path_sh/config-udhcpd.sh "lan" -p $pidfile
sh $path_sh/config-udhcpd.sh "lan" -l $leasesfile