#!/bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: psext_updown.sh $1 $2 start" >> $test_log

echo 1 > /proc/sys/net/ipv4/ip_forward
c_id=$2
ps_if=`nv get pswan`$c_id
eth_if=`nv get "ps_ext"$c_id`
ext_br="br"$c_id
ps_ext_mode=`nv get need_jilian`
#用户设置静态ip、gw，nm在此处计算
arp_proxy_kill()
{
	ps > ${path_tmp}/zte_arp_proxy.$ext_br.$$
	arp_proxy_pid=`awk 'BEGIN{temp1="'"${ext_br}"'";temp2="zte_arp_proxy"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/zte_arp_proxy.$ext_br.$$`
	rm -f ${path_tmp}/zte_arp_proxy.$ext_br.$$
	[ -n "$arp_proxy_pid" ] && { kill $arp_proxy_pid; echo "test: kill udhcpc $arp_proxy_pid " >> $test_log ; }
}

arp_proxy_set()
{
	arp_proxy_kill
	(zte_arp_proxy -i $ext_br 2>> $test_log || echo "Error: zte_arp_proxy -i $ext_br failed." >> $test_log) &
}

get_mask()
{
    mask=`echo ${ps_ip}"."${gw} | awk -F '.' '{
        nm1=0;nm2=0;nm3=0
	    if($1 == $5)
	       nm1=255
	
	    if(255 == nm1 && $2 == $6)
	       nm2=255
	
	    if(255 == nm2 && $3 == $7)
	       nm3=255
	
	    printf nm1"."nm2"."nm3".0"
    }'`
}

dhcp_set()
{
    
	start=$pdp_ip 
    end=$pdp_ip
	#nv值非空则表示用户设置了静态ip、gw
	gw=`nv get $ps_if"_gw"`
	if [ "-$gw" == "-" -o "-$gw" == "-0.0.0.0" ]; then
		gw=$br_ip
		mask=$valid_mask
        echo psip $ps_ip br_ip  $br_ip valid_mask $valid_mask  $mask
	else
        echo "no mask"
	    get_mask
	fi
	nv set $ext_br"_nm"=$mask 
	ifconfig $ext_br netmask $mask 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $eth_br netmask $mask failed." >> $test_log
    fi
    dns=`nv get $ps_if"_pridns"`
    dns2=`nv get $ps_if"_secdns"`
    lease="86400"
	
    #本地网络配置
    echo "nameserver $dns" > /etc/resolv.conf
    
	pidfile=$path_conf"/udhcpd"$c_id".pid"
    leasesfile=$path_conf"/udhcpd"$c_id".leases"

    sh $path_sh/config-udhcpd.sh $c_id -s $start
    sh $path_sh/config-udhcpd.sh $c_id -e $end
    sh $path_sh/config-udhcpd.sh $c_id -i $ext_br
    sh $path_sh/config-udhcpd.sh $c_id -m $mask
    sh $path_sh/config-udhcpd.sh $c_id -d $dns $dns2
    if [ "-$gw" != "-" ]; then
        sh $path_sh/config-udhcpd.sh $c_id -g $gw
    fi
    if [ "-$lease" != "-" ]; then
        sh $path_sh/config-udhcpd.sh $c_id -t $lease
    fi
    sh $path_sh/config-udhcpd.sh $c_id -p $pidfile
    sh $path_sh/config-udhcpd.sh $c_id -l $leasesfile
	sh $path_sh/config-udhcpd.sh $c_id -r 1
}
get_validnum()
{
    last4=${ipaddr##*.}
    ipaddr=${ipaddr%.*}
    mark=`expr $last4 % 2`
    last3=0
    frag=`expr $frag + 1`
    echo $ipaddr $last4 $last3
    if [ $last4 -eq 0 ] || [ $last4 -eq 255 ];
    then
            last3=${ipaddr##*.}
    fi
    if [ $last4 -eq 0 ] && [ $last3 -eq 0 ];
    then
        get_validnum
    elif [ $last4 -eq 255 ] && [ $last3 -eq 255 ];
    then
        get_validnum
    else
        return
    fi
}
get_netmask()
{
    ipaddr=$1
    last4=0
    last3=0
    mark=0
    frag=0
    
    get_validnum
    echo $ipaddr $last4 $last3 $mark $frag
    #将有效段中有效位置为1，该位左边都置为0
    valid_num=0
    
    if [ $mark -eq 1 -a $last3 -eq 0 ];then
        valid_num=`expr $last4 + 1`
    elif [ $mark -eq 0 -a $last3 -eq 0 ];then
        valid_num=$last4
    elif [ $mark -eq 1 -a $last3 -ne 0 ];then
        valid_num=`expr $last3 + 1`
    elif [ $mark -eq 0 -a $last3 -ne 0 ];then
        valid_num=$last3
    fi
    echo  $valid_num
    #从左向右找到有效段中第一个1的位置
    place=1
    while [ `expr $valid_num % 2` -eq 0 ]
    do
        place=`expr $place + 1`
        valid_num=`expr $valid_num / 2`
    done

    if [ $last3 -eq 0 ]
    then
        frag=`expr $frag - 1`
    fi
    count=1
    
    if [ $place -gt 8 ]
    then
        place=`expr $place - 8`
        frag=`expr $frag + 1`
    fi

    tmp_place=$place
    while [ $tmp_place -gt 0 ]
    do
        count=`expr $count \* 2`
        tmp_place=`expr $tmp_place - 1`
    done

    #至少需要三个有效ip地址（ps口，pc，网关），掩码最大为255.255.255.248
    if [ $frag -eq 0  -a  $place -eq 2 ]
    then
        count=`expr $count + 3`
    else
        count=`expr $count - 1`
    fi

    before=$frag
    
    while [ $before -lt 3 ]
    do
        valid_mask=$valid_mask"255."
        before=`expr $before + 1`
    done
        valid_mask=$valid_mask"`expr 255 - $count`"
    while [ $frag -gt 0 ]
    do
        valid_mask=$valid_mask".0"
        frag=`expr $frag - 1`
    done

    pdpip=$1
    pdp_ip4=${pdpip##*.}
    pdp_ip4_tmp=$pdp_ip4
    front3=${pdpip%.*}
    
    tmp_count=0
    com_num=0
    while [ $tmp_count -lt 3 ]
    do
        valid_count=0
        
        if [ `expr $pdp_ip4_tmp % 2` -eq 1 ]
        then
            tmp_count1=$tmp_count
            valid_count=1
            while [ $tmp_count1 -gt 0 ]
            do
                valid_count=`expr $valid_count \* 2`
                tmp_count1=`expr $tmp_count1 - 1`
            done
        fi
        com_num=`expr $com_num + $valid_count`
        tmp_count=`expr $tmp_count + 1`
        pdp_ip4_tmp=`expr $pdp_ip4_tmp / 2`
    done
    echo com_num $com_num
    
    if [ $com_num -gt 2 ]
    then 
        tmp_ip1=`expr $pdp_ip4 - 1`
        tmp_ip2=`expr $pdp_ip4 - 2`
        ps_ip="$front3.$tmp_ip1"
        br_ip="$front3.$tmp_ip2"
    else
        tmp_ip1=`expr $pdp_ip4 + 1`
        tmp_ip2=`expr $pdp_ip4 + 2`
        ps_ip="$front3.$tmp_ip1"
        br_ip="$front3.$tmp_ip2"
    fi

    echo ps_ip $ps_ip br_ip $br_ip valid_mask $valid_mask
    nv set $ps_if"_ip"=$ps_ip
}
#获取ip并配置ps、eth
get_ipaddr()
{
    pdp_ip=`nv get $ps_if"_pdp_ip"`
    get_netmask $pdp_ip

	ifconfig $ps_if $ps_ip up 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $ps_if $ps_ip up failed." >> $test_log
    fi
	nv set default_wan_rel=$ps_if
	nv set $ext_br"_ip"=$br_ip
	ifconfig $ext_br $br_ip 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $ext_br $br_ip up failed." >> $test_log
    fi
}
#路由规则，ps与eth级联
route_set()
{
    marknum=`expr $c_id + 20`
    iptables -t mangle -A PREROUTING -i $ps_if -j MARK --set-mark $marknum
	rt_num=`expr $c_id + 120`
    
    ip route add default dev $ext_br table $rt_num 	
		
	ip rule add to $pdp_ip fwmark $marknum table $rt_num
		
	marknum=`expr $c_id + 10`
    iptables -t mangle -A PREROUTING -i $ext_br -j MARK --set-mark $marknum
	rt_num=`expr $c_id + 100`

    ip route add default dev $ps_if table $rt_num
	ip rule add from $pdp_ip fwmark $marknum table $rt_num

	ip route flush cache
    
    #本地网络配置
    iptables -t nat -I POSTROUTING -s $ps_ip -o $ps_if -j SNAT --to $pdp_ip
    
	route_info=`route|grep default`
	
	if [ "$route_info" == "" ];then
		route add default dev $ps_if
	else
		echo "Debug: default route already exist." >> $test_log
	fi
}
#构建网桥
br_up()
{
    br="br"$c_id
    brctl addbr $br
    brctl setfd $br 0.1
    ifconfig $br up 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $br up failed." >> $test_log
    fi
	
	ifconfig $ps_if up 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $ps_if up failed." >> $test_log
    fi
    brctl addif $br $ps_if 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: brctl addif $br $ps_if failed." >> $test_log
    fi
    brctl addif $br $eth_if 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: brctl addif $br $eth_if failed." >> $test_log
    fi
	ifconfig $eth_if up 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $eth_if up failed." >> $test_log
    fi
	   
}
#删除网桥
br_down()
{
    br="br"$c_id
	brctl delif $br $eth_if 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: brctl delif $br $eth_if failed." >> $test_log
    fi
	ifconfig $eth_if down 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $eth_if down failed." >> $test_log
    fi
	brctl delif $br $ps_if 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: brctl delif $br $ps_if failed." >> $test_log
    fi
	ifconfig $ps_if down 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $ps_if down failed." >> $test_log
    fi
    ifconfig $br down 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $br down failed." >> $test_log
    fi
    brctl delbr $br 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: brctl delbr $br failed." >> $test_log
    fi
}
#杀死对应的DHCP进程
dhcp_kill()
{
    pidfile=$path_conf"/udhcpd"$c_id".pid"
	kill `cat $pidfile`
}
#删除对应的路由规则
route_del()
{
    pdp_ip=`nv get $ps_if"_pdp_ip"`
#	ps_ip1=${pdp_ip%.*}
#	ps_ip2=${pdp_ip##*.}
#	[ "$ps_ip2" -ge "254" ] && { ps_ip2="250"; }
#	ps_ip2=`expr $ps_ip2 + 1`
	ps_ip=`nv get $ps_if"_ip"`
	br_ip=`nv get $ext_br"_ip"`
	marknum=`expr $c_id + 10`
	rt_num=`expr $c_id + 100`
	
	iptables -t mangle -D PREROUTING -i $ext_br -j MARK --set-mark $marknum
	ip rule del from $pdp_ip fwmark $marknum table $rt_num 
    ip route del default dev $ps_if table $rt_num
	
    marknum=`expr $c_id + 20`
	rt_num=`expr $c_id + 120`
    iptables -t mangle -D PREROUTING -i $ps_if -j MARK --set-mark $marknum
	ip rule del to $pdp_ip fwmark $marknum table $rt_num
    ip route del default dev $ext_br table $rt_num 
	#本地网络配置
    iptables -t nat -D POSTROUTING -s $ps_ip -o $ps_if -j SNAT --to $pdp_ip
    if [ $? -ne 0 ];then
        echo "cmd <<iptables -t nat -D POSTROUTING -s $ps_ip -o $ps_if -j SNAT --to $pdp_ip>> exec failed"  >> $test_log
    fi
    route delete default dev $ps_if
    if [ $? -ne 0 ];then
        echo "cmd <<route delete default dev $ps_if>> exec failed"  >> $test_log
    fi
	
    ifconfig $ext_br 0.0.0.0
	ifconfig $ext_br down 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $ext_br down failed." >> $test_log
    fi
    
    ifconfig $ps_if 0.0.0.0
	ifconfig $ps_if down 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $ps_if down failed." >> $test_log
    fi
	
    #reset nv
    nv set $ext_br"_ip"=0.0.0.0
    nv set $ext_br"_nm"=0.0.0.0
    nv set $ps_if"_pdp_ip"=0.0.0.0
    nv set $ps_if"_pridns"=0.0.0.0
    nv set $ps_if"_secdns"=0.0.0.0
    nv set $ps_if"_ip"=0.0.0.0
}

if [ "-$1" == "-linkup" ]; then
	mtu=`nv get mtu`
	ifconfig $ps_if mtu $mtu
	if [ "-$ps_ext_mode" == "-1" ]; then
        brctl addbr $ext_br
        brctl setfd $ext_br 0.1
        brctl addif $ext_br $eth_if
        ifconfig $ext_br up
        get_ipaddr
		dhcp_set
	    route_set
		arp_proxy_set
        ifconfig $eth_if up
		tc_tbf.sh up $c_id
	elif [ "-$ps_ext_mode" == "-0" ]; then
	    br_up
	fi	
elif [ "-$1" == "-linkdown" ]; then
    if [ "-$ps_ext_mode" == "-1" ]; then
		tc_tbf.sh down $c_id
		arp_proxy_kill
        dhcp_kill
	    route_del
        ifconfig $eth_if down
        ifconfig $ext_br down
        brctl delif $ext_br $eth_if
        brctl delbr $ext_br 
	elif [ "-$ps_ext_mode" == "-0" ]; then
	    br_down
	fi	
fi
