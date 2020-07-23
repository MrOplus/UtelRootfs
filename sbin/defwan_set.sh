#!/bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: defwan_set.sh $1 start" >> $test_log
nd_dns=`nv get lan_ipaddr`
#linux系统etc目录可读写，resolv.conf可以直接放在etc下，同步uc代码时注意不要将此处同步
resolv_conf=/etc/resolv.conf
dnsmasq_resolv_conf=$path_conf/dnsmasq.resolv.conf
dnsmasq_conf=/tmp/dnsmasq.conf

killall -9 dnsmasq
def_cid=`nv get default_cid`

if [ "-$1" == "-pswan" ]; then
    ipaddr_type=`nv get "pdp_act_type"$def_cid`
elif [ "-$1" == "-ethwan" ]; then
    ipaddr_type=`nv get eth_act_type`
elif [ "-$1" == "-wifiwan" ]; then
    ipaddr_type=`nv get wifi_act_type`
fi

#获取默认网口
wan_if=$defwan_if
wan6_if=$defwan6_if

echo "" > $dnsmasq_resolv_conf

#如果本地应用需要使用dnsmasq的功能，需要在"/etc/resolv.conf" 文件中添加 "127.0.0.1"，必须放在第一条
echo "" > $resolv_conf
echo nameserver 127.0.0.1 > $resolv_conf


#DNS对于同一网口，不清楚将来需求是否支持分别对v4、v6进行auto、manual设置，此处暂时做成可分别设置
#设置IPv4 缺省路由 DNS
if [ "-$ipaddr_type" == "-IPv4" -o "-$ipaddr_type" == "-IPv4v6" -o "-$ipaddr_type" == "-IPV4V6" -o "-$ipaddr_type" == "-" ];then
	#设置IPv4的默认网关
	route del default
	Flag=`route | grep -w "default"`
	if [ "-$Flag" != "-" ];then
	    echo "Error: route del default failed." >> $test_log
	fi

	defwan_gw=`nv get $wan_if"_gw"`
	if [ "-$defwan_gw" != "-" -o "-$defwan_rel" != "-" ];then
        route add default gw $defwan_gw dev $defwan_rel 2>>$test_log
	    if [ $? -ne 0 ];then
	        echo "Error: route add default gw $defwan_gw dev $defwan_rel failed." >> $test_log
	    fi
	fi
	
    #防止内网地址泄露功能，内网地址在lan.sh中设置，外网口此处设置
    echo $defwan_rel > /sys/module/lanip_filter_ipv4/parameters/default_wan_name
    
	#dnsmode由atserver处理，传实际使用的值，此处仅使用一个nv，不区分auto manual
	dns_mode=`nv get $1"_dns_mode"`
	if [ "-$1" == "-pswan" -o "-$dns_mode" == "-auto" -o "-$dns_mode" == "-" ]; then
	        pridns=`nv get $wan_if"_pridns"`
		    secdns=`nv get $wan_if"_secdns"`
	elif [ "-$dns_mode" == "-manual" ]; then	
		pridns=`nv get $1"_pridns_manual"`
		secdns=`nv get $1"_secdns_manual"`
	fi
	
	if [ "-$pridns" == "-" -o "-$pridns" == "-0.0.0.0" ] && [ "-$secdns" == "-" -o "-$secdns" == "-0.0.0.0" ]; then
		pridns="114.114.114.114"
		secdns="8.8.8.8"
	fi
	
	if [ "-$pridns" != "-" -a "-$pridns" != "-0.0.0.0" ]; then
		echo nameserver $pridns > $dnsmasq_resolv_conf
	fi
	if [ "-$secdns" != "-" -a "-$secdns" != "-0.0.0.0" ]; then
		echo nameserver $secdns >> $dnsmasq_resolv_conf
	fi
		
	dns_extern=`nv get dns_extern`
	if [ -n "$dns_extern" ]; then
		echo nameserver $dns_extern >> $dnsmasq_resolv_conf
	fi
	if [ "-$1" == "-pswan" ]; then
		tc_tbf.sh up $def_cid
	fi
fi

#已设置好外网口则开转发
if [ "-$wan_if" != "-" ]; then
	echo 1 > /proc/sys/net/ipv4/ip_forward
fi

#设置IPv6 DNS
if [ "-$ipaddr_type" == "-IPv6" -o "-$ipaddr_type" == "-IPV6" -o "-$ipaddr_type" == "-IPv4v6" -o "-$ipaddr_type" == "-IPV4V6" ];then
	#dnsmode由atserver处理，传实际使用的值，此处仅使用一个nv，不区分auto manual
	ipv6_dns_mode=`nv get $1"_ipv6_dns_mode"`
	if [ "-$1" == "-pswan" -o "-$ipv6_dns_mode" == "-auto" -o "-$ipv6_dns_mode" == "-" ]; then
	    ipv6_pridns=`nv get $wan6_if"_ipv6_pridns_auto"`
        ipv6_secdns=`nv get $wan6_if"_ipv6_secdns_auto"`
	elif [ "-$ipv6_dns_mode" == "-manual" ]; then	
            ipv6_pridns=`nv get $1"_ipv6_pridns_manual"`
            ipv6_secdns=`nv get $1"_ipv6_secdns_manual"`
	fi
    
    nv set $wan6_if"_radvd_ipv6_dns_servers"=$ipv6_pridns,$ipv6_secdns
	
    if [ -n "$ipv6_pridns" ] && [ "$ipv6_pridns" != "::" ] && [ "$ipv6_pridns" != "::0" ] && [ "$ipv6_pridns" != "0000:0000:0000:0000:0000:0000:0000:0000" ];then
        echo nameserver $ipv6_pridns >> $dnsmasq_resolv_conf
    fi
            
    if [ -n "$ipv6_secdns" ] && [ "$ipv6_secdns" != "::" ] && [ "$ipv6_secdns" != "::0" ] && [ "$ipv6_secdns" != "0000:0000:0000:0000:0000:0000:0000:0000" ];then
        echo nameserver $ipv6_secdns >> $dnsmasq_resolv_conf
    fi
		
	ipv6_dns_extern=`nv get ipv6_dns_extern`
	if [ -n "$ipv6_dns_extern" ]; then
		echo nameserver $ipv6_dns_extern >> $dnsmasq_resolv_conf
	fi	
    if [ "-$1" == "-pswan" ]; then
		tc_tbf.sh up $def_cid
	fi
fi

nv set $wan6_if"_radvd_ipv6_dns_servers"=$ipv6_pridns,$ipv6_secdns

#设置给页面显示当前外网IP地址
#设置IPv4页面显示地址
if [ "-$ipaddr_type" == "-IPv4" -o "-$ipaddr_type" == "-IPV4" -o "-$ipaddr_type" == "-IPv4v6" -o "-$ipaddr_type" == "-IPV4V6" -o "-$ipaddr_type" == "-" ]; then
    wan4_ip=`nv get $wan_if"_ip"`
    nv set wan_ipaddr="$wan4_ip"
fi

#设置IPv6页面显示地址
if [ "-$ipaddr_type" == "-IPv6" -o "-$ipaddr_type" == "-IPV6" -o "-$ipaddr_type" == "-IPv4v6" -o "-$ipaddr_type" == "-IPV4V6" ]; then
    wan6_ip=`nv get $wan6_if"_ipv6_ip"`
    nv set ipv6_wan_ipaddr="$wan6_ip"
fi
usblan=`nv get usblan`
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

# ppp0需要设置MSS最长为1440，否则可能tcp不通
if [ "$defwan_rel" == "ppp0"  ]; then
    echo "Info: dns_set ppp0 set MSS 1440" >> $test_log
    iptables -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1440
fi


