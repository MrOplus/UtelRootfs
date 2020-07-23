#!/bin/sh 

path_sh=`nv get path_sh`
. $path_sh/global.sh

echo "input param is $1"
echo "Info: wan_ipv6_config.sh $1 start" >> $test_log

wan_addr_temp=`nv get $wan_if"ipv6_wan_ipaddr"`
wan_addr=`echo $wan_addr_temp | sed 's/\/64//'`

is_chinamobile_pd_diff=`nv get pd_chinamobile_enable`
pd_chinamobile=`nv get pd_chinamobile`
prefix_len=`nv get pd_len_chinamobile`

b_dhcpv6stateEnabled=`nv get dhcpv6stateEnabled`
b_dhcpv6statelessEnabled=`nv get dhcpv6statelessEnabled`

############# 获取默认网口名相关信息 ############
get_default_wan_info()
{
    wan_if_name=$1
    wan_if=$defwan6_if
    wan_addr=`nv get $wan_if"_ipv6_ip"`
	def_cid=`nv get default_cid`
	
    if [ "$1" == "pswan" ]; then
        ipaddr_type=`nv get "pdp_act_type"$def_cid`
    elif [ "$1" == "ethwan" ]; then
        ipaddr_type=`nv get eth_act_type`
    elif [ "$1" == "wifiwan" ]; then
        ipaddr_type=`nv get wifi_act_type`
    fi

    #需要用到相关配置文件
    dhcp6s_conf=$path_conf/dhcp6s_$wan_if.conf
    radvd_conf=$path_conf/radvd_$wan_if.conf
	radvd_pidfile=$path_tmp/radvd_$wan_if.pid
    ndp_log=$path_conf/ndp_$wan_if.log

    echo "test: default_wan_if_info = $wan_if, wan_addr:$wan_addr"
}

#############linkup  dhcpserver set############
linkup_add_dns_to_dhcp6s_radvd_conf()
{
    # ipv6 dns set
    ipv6_dns_mode=`nv get $wan_if_name"_ipv6_dns_mode"`
    echo "ipv6_dns_mode:$ipv6_dns_mode"
    echo "the input param  is $1"
    
    ipv6_prefer_dns=""
    ipv6_standby_dns=""
    if [ "-$ipv6_dns_mode" = "-auto" ];then
     
          ipv6_pridns_auto=`nv get $wan_if"_ipv6_pridns_auto"`
          ipv6_secdns_auto=`nv get $wan_if"_ipv6_secdns_auto"`
          
            if [ -n "$ipv6_pridns_auto" ] && [ "-$ipv6_pridns_auto" != "-::" ] && [ "-$ipv6_pridns_auto" != "-::0" ];then
                ipv6_prefer_dns=$ipv6_pridns_auto
            fi
            
            if [ -n "$ipv6_secdns_auto" ] && [ "-$ipv6_secdns_auto" != "-::" ] && [ "-$ipv6_secdns_auto" != "-::0" ];then
                ipv6_standby_dns=$ipv6_secdns_auto
            fi

    elif [ "-$ipv6_dns_mode" = "-manual" ];then
            #对于手动DNS，页面只能设置到pswan口，所以对于手动dns，不管何种模式，暂时都取用pswan的手动dns地址
            ipv6_pridns_manual=`nv get $pswan_if_name"_ipv6_pridns_manual"`
            ipv6_secdns_manual=`nv get $pswan_if_name"_ipv6_secdns_manual"`
            
            if [ -n "$ipv6_pridns_manual" ] && [ "-$ipv6_pridns_manual" != "-::" ] && [ "-$ipv6_pridns_manual" != "-::0" ];then
                ipv6_prefer_dns=$ipv6_pridns_manual
            fi
            
            if [ -n "$ipv6_secdns_manual" ] && [ "-$ipv6_secdns_manual" != "-::" ] && [ "-$ipv6_secdns_manual" != "-::0" ];then
                ipv6_standby_dns=$ipv6_secdns_manual
            fi
            
      fi

    if [ "-$ipv6_prefer_dns" == "-" -a "-$ipv6_standby_dns" == "-" ]; then
        return
    else
        if [ -n "$1" ] && [ "$1" == "dhcp6s" ] ;then
            echo -e "\toption dns_servers $ipv6_prefer_dns $ipv6_standby_dns;" >> $dhcp6s_conf
        elif [ -n "$1" ] && [ "$1" == "radvd" ] ;then
            # del last line
            sed -i '$d' $radvd_conf
            echo -e "\tRDNSS $ipv6_prefer_dns $ipv6_standby_dns\n\t{" >> $radvd_conf
            echo -e "\t\tAdvRDNSSPreference 15;" >> $radvd_conf
            echo -e "\t\tAdvRDNSSOpen on;" >> $radvd_conf
            echo -e "\t};\n};" >> $radvd_conf
        fi
    fi
}

linkup_dhcpv6_server_set()
{
    prefix_len=64
    
    dhcp6s_kill
    rm -fr $dhcp6s_conf

    if [ "-$is_chinamobile_pd_diff" = "-1" ] ; then
        nv set pd_chinamobile=""
        nv set pd_len_chinamobile=""
        dhcp6c -dDf -z $wan_if &
        for i in a b c d e; do
          #sleep 1;
          pd_chinamobile=`nv get pd_chinamobile`
          if [ "-$pd_chinamobile" == "-" ]; then
            echo "no pd get";
          else
            echo "pd get";
            break;
          fi
        done
        pd_chinamobile=`nv get pd_chinamobile`
        prefix_len=`nv get pd_len_chinamobile`
        if [ "-$pd_chinamobile" == "-" ]; then
            dhcp6c_kill
            prefix_len="64"
        else
          wan_addr=$pd_chinamobile
          # here br0 is bind by dhcp6c, need to kill then run dhcp6s，need to fix
          dhcp6c_kill
          #sleep 1
        fi
    else
        echo "not chinamobile"
    fi
    
    ipv6_addr_conver "$wan_addr" "$wan_if"
    dhcpv6_start=`nv get $wan_if"_dhcpv6_start"`
    dhcpv6_end=`nv get $wan_if"_dhcpv6_end"`
    echo -e "interface br0 {" > $dhcp6s_conf
    #set up dhcpv6 addr pool
    if [ "-$b_dhcpv6stateEnabled" = "-1" ];then
        echo -e "\tserver-preference 255;\n\trenew-time 6000;" >> $dhcp6s_conf
        echo -e "\trebind-time 9000;\n\tprefer-life-time 1300;" >> $dhcp6s_conf
        echo -e "\tvalid-life-time 2000;\n\tallow rapid-commit;" >> $dhcp6s_conf
        echo -e "\tlink br0 {\n\t\tallow unicast;\n\t\tsend unicast;" >> $dhcp6s_conf
        echo -e "\t\tpool {\n\t\t\trange $dhcpv6_start to $dhcpv6_end/$prefix_len;" >> $dhcp6s_conf
        echo -e "\t\t};\n\t};" >> $dhcp6s_conf
        linkup_add_dns_to_dhcp6s_radvd_conf dhcp6s
        echo -e "};" >> $dhcp6s_conf
        dhcp6s -dDf -c $dhcp6s_conf $lan_if &
    else
        #slaac with dhcp statelessset dns info
        if [ "-$b_dhcpv6statelessEnabled" = "-1" ];then
            echo -e "\tlink br0 {\n\t};" >> $dhcp6s_conf
            linkup_add_dns_to_dhcp6s_radvd_conf dhcp6s
            echo -e "};" >> $dhcp6s_conf
            dhcp6s -dDf -c $dhcp6s_conf $lan_if &
        fi
    fi
}

#############linkup  radvd set############
linkup_radvd_set() 
{
    echo  "enter linkup_radvd_set "

    prefix_len=64

    if [ "-$is_chinamobile_pd_diff" = "-1" ] ; then
        pd_chinamobile=`nv get pd_chinamobile`
        prefix_len=`nv get pd_len_chinamobile`
        if [ "-$pd_chinamobile" == "-" ]; then
            prefix_len="64"
        else
            wan_addr=$pd_chinamobile
        fi
    else
        prefix_len="64"
        echo "not chinamobile"
    fi
    
    rm -rf $radvd_conf
    #wangming delete
    if [ "-$b_dhcpv6stateEnabled" = "-1" ];then
        echo -e "interface br0\n{\n\tAdvSendAdvert on;" > $radvd_conf
        echo -e "\tAdvManagedFlag on;\n};" >> $radvd_conf
        radvd_kill
		rm -rf $radvd_pidfile
        radvd -d 3 -C $radvd_conf -p $radvd_pidfile &
        echo  "leave linkup_radvd_set "
        return
    fi
    
    cp $path_conf/radvd_template.conf $radvd_conf
	
	sed  -i -e 's/#ipv6_wan_addr#\/64/#ipv6_wan_addr#\/#prefix_len#/g' $radvd_conf
    sed  -i -e s/#ipv6_wan_addr#/$wan_addr/g $radvd_conf 
    sed  -i -e s/#prefix_len#/$prefix_len/g $radvd_conf
    sed  -i -e s/#adv_switch#/on/g $radvd_conf 

    echo "copy radvd_template.conf"
    echo "wan_addr:$wan_addr"
    echo "prefix_len:$prefix_len"

#slaac with dns info
    if [ "-$b_dhcpv6statelessEnabled" = "-1" ];then
        echo "use dhcpv6stateless for dns"
    else
        sed -i -e 's/AdvOtherConfigFlag on;/AdvOtherConfigFlag off;/g' $radvd_conf
        linkup_add_dns_to_dhcp6s_radvd_conf radvd
    fi

    radvd_kill
    #sleep 1
	rm -rf $radvd_pidfile
    radvd -d 3 -C $radvd_conf -p $radvd_pidfile &

    echo  "leave linkup_radvd_set "
}

#############linkup resolve config set############
linkup_route_set() 
{
    default_gw_addr_temp=`nv get $wan_if"_ipv6_gw"`
    echo "ipv6_wan_default_gw = $default_gw_addr_temp"

    echo 0 > /proc/sys/net/ipv6/conf/all/forwarding 

    if [ -n "$default_gw_addr_temp" ] ; then
        ip -6 route add default via $default_gw_addr_temp dev $defwan6_rel
    else
        ip -6 route add default dev $defwan6_rel
    fi
    
    nv set ipv6_br0_addr="::"
    
    ipv6_addr_conver "$wan_addr" "$wan_if"
    
    ipv6_br0_addr_tmp=`nv get ipv6_br0_addr`
    echo "ipv6_br0_addr_tmp = $ipv6_br0_addr_tmp"
    
    ip -6 addr add  $ipv6_br0_addr_tmp/64 dev br0    
    
    #enable ipv6 packet forwarding
    #sleep 3
    echo 1 > /proc/sys/net/ipv6/conf/all/forwarding

    #enable ipv6 neigh discovery proxy
    echo 1 > /proc/sys/net/ipv6/conf/all/proxy_ndp
    
    ndp_kill
    zte_ndp -a -s br0 -d "$wan_if" -l $ndp_log &

}

############ipv6 shell entry#################
get_default_wan_info $1
linkup_route_set 
linkup_dhcpv6_server_set
linkup_radvd_set
#linkup_resolve_config_set #由zte_router对IPv4，IPv6统计进行dns的相关操作

