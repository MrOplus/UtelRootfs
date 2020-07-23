#!/bin/sh
#
# $Id: upnp.sh,v 1.22.6.1 2008-10-02 12:57:42 winfred Exp $
#
# usage: upnp.sh
#
path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: upnp.sh start " >> $test_log


# stop all
killall -9 miniupnpd
sh $path_sh/upnp_ipt_remove.sh

# upnp
upnp=`nv get upnpEnabled`
fw_switch=`nv get firewall_switch`
if [ "$upnp" = "1" -a "$fw_switch" = "1" ]; then
	if [ -f /mnt/jffs2/pidfile/miniupnp.pid ]
	then
		rm -f /mnt/jffs2/pidfile/miniupnpd.pid
	fi
	
	if [ -f /var/run/miniupnpd.pid ]
	then
		rm -f /var/run/miniupnpd.pid
	fi	
	
	if [ -f $path_conf/miniupnpd.conf ]
	then
		echo "/mnt/jffs2/etc/miniupnpd.conf already exist!"
	    rm $path_conf/miniupnpd.conf
	fi
	
	cp $path_conf/miniupnpd_temp.conf $path_conf/miniupnpd.conf
	
	gw=`nv get lan_ipaddr`
	. $path_sh/upnp_set_listenip.sh $gw/16
	
	route del -net 239.0.0.0 netmask 255.0.0.0 dev $lan_if
	route add -net 239.0.0.0 netmask 255.0.0.0 dev $lan_if 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: route add -net 239.0.0.0 netmask 255.0.0.0 dev $lan_if failed." >> $test_log
    fi
	. $path_sh/upnp_ipt_init.sh
	miniupnpd -f $path_conf/miniupnpd.conf &
fi
