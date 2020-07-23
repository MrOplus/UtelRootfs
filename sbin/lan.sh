#!/bin/sh
#
# $Id: lan.sh
#
path_sh=`nv get path_sh`
. $path_sh/global.sh

br_set()
{
    br_name=$lan_if

    #设置网桥
    echo "ifconfig $br_name down...................."
    ifconfig $br_name down

    echo "brctl delbr $br_name......................"
    brctl delbr $br_name

    echo "brctl addbr $br_name......................"
    brctl addbr $br_name 2>>$test_log
    if [ $? -ne 0 ];then
        echo "Error: brctl addbr $br_name failed." >> $test_log
    fi
    echo "brctl setfd $br_name 0.1.................."
    brctl setfd $br_name 0.1 2>>$test_log
    if [ $? -ne 0 ];then
        echo "Error: brctl setfd $br_name 0.1 failed." >> $test_log
    fi
    echo "ifconfig lo up......................."
    ifconfig lo up 2>>$test_log
    if [ $? -ne 0 ];then
        echo "Error: ifconfig lo up failed." >> $test_log
    fi
    echo "ifconfig $br_name up......................"
    ifconfig $br_name up 2>>$test_log
    if [ $? -ne 0 ];then
        echo "Error: ifconfig $br_name up failed." >> $test_log
    fi

    #打开网桥地址改变通知的开关
    echo 1 > /proc/sys/net/ipv4/conf/$br_name/arp_notify
    
    br_node=`nv get br_node`

    #analysis br_node ex: usb0+wifi0+…
    IFS_OLD=$IFS
    IFS="+"
    for device in $br_node
    do
        ifconfig $device up
	if [ $? = 0 ];then
		brctl addif $br_name $device 2>>$test_log
		if [ $? -ne 0 ];then
		    echo "Error: brctl addif $br_name $device failed." >> $test_log
		fi
	fi
    done
    IFS=$IFS_OLD
    
}

lan_set()
{
    ip=`nv get lan_ipaddr`
    nm=`nv get lan_netmask`
    ifconfig $lan_if $ip netmask $nm 2>>$test_log
    if [ $? -ne 0 ];then
        echo "Error: ifconfig $lan_if $ip netmask $nm failed." >> $test_log
    fi
}

#解析内网地址、网关地址通过proc机制动态传递给内核，以便内核实现防止内网地址泄露功能
lanip_proc()
{
    #ip地址换算成4字节整型是网络字节序，要颠倒下
    #uclinux不支持左移字符
	ip_value=`echo "$ip" | awk -F '.' '{printf $1 + 256* $2 + 256*256* $3 + 256*256*256* $4}'`
	nm_value=`echo "$nm" | awk -F '.' '{printf $1 + 256* $2 + 256*256* $3 + 256*256*256* $4}'`

    echo $ip_value > /sys/module/lanip_filter_ipv4/parameters/lan_ipaddr
    echo $nm_value > /sys/module/lanip_filter_ipv4/parameters/lan_netmask
}

main()
{
    lan_enable=`nv get LanEnable`
    if [ "x$lan_enable" == "x0" ]; then
        exit 0
    fi

    echo "Info: lan.sh start" >> $test_log

    if [ "x$lan_enable" == "x1" ]; then
        br_set
    fi
	
	if [ "x$lan_if" != "x" ]; then
        lan_set
    fi
    
    #vlan配置，暂时放于此处，1 开机的时候不需要将sw加入到网桥下 
    #2 此处必须将sw up起来，如果不up的话将不会有rj45热插拔事件
    sw_name=`nv get swvlan`
    tz_eth_mac=`nv get gmac_addr`

	if [ "x$tz_eth_mac" = "x" ]; then
        	ifconfig $sw_name up
    	else
    		ifconfig $sw_name down
    		ifconfig $sw_name hw ether $tz_eth_mac up
		if [ "$?" != "0" ]; then
			sleep 1
			ifconfig $sw_name hw ether $tz_eth_mac up
		fi
    		tz_eth_name=`nv get ethlan`
    		ifconfig $tz_eth_name down
    		ifconfig $tz_eth_name hw ether $tz_eth_mac up
	fi

    natenable=`nv get natenable`
    if [ "x$natenable" != "x0" ]; then
        lanip_proc
    fi

    #默认外网口尚未激活，先设置为空
    echo "" > /sys/module/lanip_filter_ipv4/parameters/default_wan_name
    usblan=`nv get usblan`
    dnsmasq_resolv_conf=$path_conf/dnsmasq.resolv.conf
    dnsmasq_conf=/tmp/dnsmasq.conf
    # dnsmasq need group name
    [ ! -f /etc/group ] && cp /etc_ro/group /etc/
    echo "user=admin" > $dnsmasq_conf
    echo "group=root" >> $dnsmasq_conf
    echo "interface=$lan_if,$usblan" >> $dnsmasq_conf
    domain_enabled=`nv get lan_domain_Enabled`
    if [ $domain_enabled = '1' ]; then
        local ip=`nv get lan_ipaddr`
        local localDomain=`nv get LocalDomain`
        echo "address=/$localDomain/$ip" >> $dnsmasq_conf
    fi
    sh /sbin/config-dhcp.sh

upnp=`nv get upnpEnabled`
if [ "$upnp" == "1" ]; then
	. $path_sh/upnp.sh
fi

    
	#获取br0的ipv6地址
    ipv6lanipaddrcmd="ifconfig $br_name | grep Scope:Link | sed 's/^.*addr: //g' | sed 's/\/.*$//g'"
    ipv6lanipaddr=`eval $ipv6lanipaddrcmd`
    nv set ipv6_lan_ipaddr=$ipv6lanipaddr
}

main
