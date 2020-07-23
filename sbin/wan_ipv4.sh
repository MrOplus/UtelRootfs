#!/bin/sh
#usg: wan_ipv4 linkup pswan
 
path_sh=`nv get path_sh`
. $path_sh/global.sh

#入参中有c_id则设置，没有则置零，用于设置策略路由表号
if [ "-$3" == "-" ]; then
    c_id="0"
else
    c_id=$3
fi
def_cid=`nv get default_cid`
ps_if=`nv get pswan`$c_id

#获取网络设备名
get_wan_if()
{
	case $1 in 
	"pswan")
		wan_if="$pswan_name"$2 ;;
	"ethwan")
		wan_if=$ethwan_if ;;
	"wifiwan")
		wan_if=$wifiwan_if ;;		
	esac
	
	mtu=`nv get mtu`
	ifconfig $wan_if mtu $mtu
}
#设置工作状态 正在连接：connect 已连接：working 已断开：dead
state_set()
{
	if [ "-$wan_name" == "-wifiwan" ]; then
		nv set wifi_state="working"	
	elif [ "-$wan_name" == "-ethwan" ]; then
		nv set rj45_state="working"		
	fi
}
#根据网口是否用于普通上外网，确定是否需要发消息给zte_router
msg_zte_router()
{
	if [ "-$c_id" == "-0" -o "-$c_id" == "-$def_cid" ]; then
		(router_msg_proxy ipv4 wan_ipv4.sh >> $test_log 2>&1 || echo "Error: router_msg_proxy ipv4 wan_ipv4.sh failed." >> $test_log) &
	fi
}

linkup()
{
	#$1 :pswan / usbwan / ethwan / wifiwan
	wan_name=$1
	wan_mode=`nv get $wan_name"_mode"`
	
	#获取wan_if变量
	get_wan_if $1 $2
	
	if [ "-$wan_mode" == "-static" ]; then
		wan_ip=`nv get "static_"$wan_name"_ip"`
		wan_gw=`nv get "static_"$wan_name"_gw"`
		wan_pridns=`nv get "static_"$wan_name"_pridns"`
		wan_secdns=`nv get "static_"$wan_name"_secdns"`
		wan_nm=`nv get "static_"$wan_name"_nm"`
		if [ "-$wan_name" != "-wifiwan" ]; then
			ifconfig $wan_if down 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if down failed." >> $test_log
            fi
			ifconfig $wan_if $wan_ip up 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if $wan_ip up failed." >> $test_log
            fi
		fi
		if [ "-$wan_name" == "-ethwan" ]; then
			nv set eth_curmode="static"
			#rj45静态连接，关闭超时计时器
			(router_msg_proxy del_timer ethwan >> $test_log 2>&1 || echo "Error: router_msg_proxy del_timer failed." >> $test_log) &
		fi		
		
		#设置网络设备状态标志为working	
		state_set
		#set ip、gw、dns to nv
		nv set $wan_if"_ip"=$wan_ip
		nv set $wan_if"_gw"=$wan_gw
		nv set $wan_if"_pridns"=$wan_pridns
		nv set $wan_if"_secdns"=$wan_secdns
	
		wan_pri=`nv get $1"_priority"`
		rt_num=`expr $wan_pri \* 10 + $c_id`
		ip rule add from $wan_ip table $rt_num 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ip rule add from $wan_ip table $rt_num failed." >> $test_log
        fi
		ip route add default via $wan_gw table $rt_num 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ip route add default via $wan_gw table $rt_num failed." >> $test_log
        fi
		ip route flush cache 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ip route flush cache failed." >> $test_log
        fi
       
		#in this proxy ,we send msg to zte_mainctrl 
		msg_zte_router
	   
	# pswan PDP 	 
	elif [ "-$wan_mode" == "-pdp" ]; then
		pswan_ip=`nv get $wan_if"_ip"`
		pswan_gw=`nv get $wan_if"_gw"`
		pswan_pridns=`nv get $wan_if"_pridns"`
		pswan_secdns=`nv get $wan_if"_secdns"`
		pswan_nm=`nv get $wan_if"_nm"`
		
		ifconfig $wan_if down 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ifconfig $wan_if down failed." >> $test_log
        fi
		ifconfig $wan_if $pswan_ip up 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ifconfig $wan_if $pswan_ip up failed." >> $test_log
        fi
		
		pswan_pri=`nv get pswan_priority`
		rt_num=`expr $pswan_pri \* 10 + $c_id`
		ip rule add from $pswan_ip table $rt_num 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ip rule add from $pswan_ip table $rt_num failed." >> $test_log
        fi
		ip route add default via $pswan_gw table $rt_num 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ip route add default via $pswan_gw table $rt_num failed." >> $test_log
        fi
		ip route flush cache 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ip route flush cache failed." >> $test_log
        fi
		      
		msg_zte_router
	
	elif [ "-$wan_mode" == "-auto" ]; then
		pppoe_user=`nv get pppoe_username`
		pppoe_pass=`nv get pppoe_password`
		udhcpc_kill
		pppoe_kill
		
		if [ "-$wan_name" == "-ethwan" ]; then
			nv set eth_curmode=""
		fi	
		if [ "-$wan_name" != "-wifiwan" ]; then
			ifconfig $wan_if down 2>>$test_log
		    if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if down failed." >> $test_log
            fi
			ifconfig $wan_if up 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if up failed." >> $test_log
            fi
		fi
		
    	if [ "-${pppoe_user}" = "-" -a "-${pppoe_pass}" = "-" ];then
		    echo "auto wan_mode: pppoe_user is ${pppoe_user}, pppoe_pass is ${pppoe_pass}, so start dhcp client. " >> $test_log
			udhcpc -i $wan_if -s $path_sh/udhcpc.sh &
		else
			sh $path_sh/pppoe_dail.sh connect	
		fi
		
	elif [ "-$wan_mode" == "-dhcp" ]; then
		udhcpc_kill
		pppoe_kill
		
		if [ "-$wan_name" == "-pswan" ]; then
		    ifconfig $wan_if arp 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if arp failed." >> $test_log
            fi
		fi
		
		if [ "-$wan_name" == "-ethwan" ]; then
			nv set eth_curmode="dhcp"
		fi	
		
		if [ "-$wan_name" != "-wifiwan" ]; then
			ifconfig $wan_if down 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if down failed." >> $test_log
            fi
			ifconfig $wan_if up 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if up failed." >> $test_log
            fi
		fi
		udhcpc -i $wan_if -s $path_sh/udhcpc.sh &		
	
	elif [ "-$wan_mode" == "-pppoe" ]; then
		udhcpc_kill
		pppoe_kill
		
		if [ "-$wan_name" == "-ethwan" ]; then
			nv set eth_curmode="pppoe"
		fi	
		
		if [ "-$wan_name" != "-wifiwan" ]; then
			ifconfig $wan_if down 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if down failed." >> $test_log
            fi
			ifconfig $wan_if up 2>>$test_log
			if [ $? -ne 0 ];then
	            echo "Error: ifconfig $wan_if up failed." >> $test_log
            fi
		fi
		sh $path_sh/pppoe_dail.sh connect	
	fi
	
}

del_default_wan()
{
	default_wan_name=`nv get default_wan_name`
	if [ "$1" == "$default_wan_name" ]; then
		nv set default_wan_name=""
		nv set default_wan_rel=""
	fi
}

linkdown()
{
	wan_name=$1
	get_wan_if $1 $2

	udhcpc_kill
	pppoe_kill
	
	if [ "-$c_id" == "-0" -o "-$c_id" == "-$def_cid" ]; then
		echo 0 > /proc/sys/net/ipv4/ip_forward
	fi
	
	ifconfig $wan_if 0.0.0.0 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $wan_if 0.0.0.0 failed." >> $test_log
    fi
	if [ "$wan_name" == "wifiwan" ]; then
		echo $wan_if > /proc/net/dev_down
	else
		ifconfig $wan_if down 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ifconfig $wan_if down failed." >> $test_log
        fi
	fi
	wan_ip=`nv get $wan_if"_ip"`
	wan_gw=`nv get $wan_if"_gw"`
	
	route del default gw $wan_gw dev $wan_if 
	#if [ $? -ne 0 ];then
	#    echo "Error: route del default gw $wan_gw dev $wan_if failed." >> $test_log
    #fi
		
	#del policy router
	wan_pri=`nv get $1"_priority"`
	rt_num=`expr $wan_pri \* 10 + $c_id`
	ip rule del from $wan_ip table $rt_num 
	#if [ $? -ne 0 ];then
	#    echo "Error: ip rule del from $wan_ip table $rt_num failed." >> $test_log
    #fi
	ip route del default via $wan_gw table $rt_num 
	#if [ $? -ne 0 ];then
	#    echo "Error: ip route del default via $wan_gw table $rt_num failed." >> $test_log
    #fi
	
	#wan_ipadd需要适配
	if [ "$wan_if" == "$defwan_if" ]; then
		nv set wan_ipaddr=""
	fi
	nv set $wan_if"_ip"=0.0.0.0
	nv set $wan_if"_nm"=0.0.0.0
	nv set $wan_if"_gw"=0.0.0.0
	nv set $wan_if"_pridns"=0.0.0.0
	nv set $wan_if"_secdns"=0.0.0.0
	
	if [ "$2" == "$def_cid" ]; then
		nv set default_cid=""
	fi
	del_default_wan $wan_if 
	msg_zte_router 

}

echo "Info: wan_ipv4.sh $1 $2 $3 start" >> $test_log
tz_ipaddr_set()
{
	pdp_ip=`nv get $ps_if"_ip"`
	ps_ip1=${pdp_ip%.*}
	ps_ip2=${pdp_ip##*.}  

	#pdp_ip第四位的最后1bit取反
	[ "$ps_ip2" -ge "254" ] && { ps_ip2="250"; }
	ps_ip3=`expr $ps_ip2 + 1`
	ps_ip4=`expr $ps_ip2 - 1`

	ps_ip=$ps_ip1"."$ps_ip3
	
	ifconfig $ps_if $ps_ip netmask 255.255.255.0 up
	if [ $? -ne 0 ];then
	    echo "Error: ifconfig $ps_if $ps_ip up failed." >> $test_log
    	fi
	echo "Info: ifconfig $ps_if $ps_ip gw $ps_ip up" >> $test_log

}
tz_del()
{
	ifconfig $ps_if down
	if [ $? -ne 0 ];then
		echo "Error: ifconfig $ps_if down failed." >> $test_log
	fi
	
	#nv set ppp_cid=""
	#nv set $eth_if"_ip"=0.0.0.0
	#nv set $eth_if"_nm"=0.0.0.0
	nv set $ps_if"_ip"=
	nv set $ps_if"_pridns"=
	nv set $ps_if"_secdns"=
}

multiapn_en=`nv get tz_multiapn_enable`
apn2_en=`nv get tz_apn2_enable`
apn3_en=`nv get tz_apn3_enable`
voipapn_en=`nv get voip_apn_enable`
if [ "-$multiapn_en" == "-1" -a "-$c_id" == "-3" ]; then
	if [ "$1" == "linkup" ]; then  
        	tz_ipaddr_set		
	elif [ "$1" == "linkdown" ]; then  
		tz_del
	fi
	sh /sbin/tz_multi_apn.sh $c_id 2
elif [ "-$voipapn_en" == "-1" -a "-$c_id" == "-4" ]; then
	if [ "$1" == "linkup" ]; then
		pdp_ip=`nv get $ps_if"_ip"`
        	ifconfig $ps_if $pdp_ip netmask 255.255.255.248 up
	elif [ "$1" == "linkdown" ]; then  
		tz_del
	fi
	sh /sbin/tz_voip_apn.sh $c_id 3
elif [ "-$multiapn_en" == "-1" -a "-$c_id" == "-4" ]; then
	if [ "$1" == "linkup" ]; then  
        	tz_ipaddr_set		
	elif [ "$1" == "linkdown" ]; then  
		tz_del
	fi
	sh /sbin/tz_multi_apn.sh $c_id 3
else
	tz_eth_type=`nv get eth_type`
	result=$(cat /version | grep "tz_real_version:LT90K")
	if [ "$1" == "linkup" ]; then
		linkup $2 $3
		if [ "$2" == "ethwan" ] && [ "$tz_eth_type" == "wan" ] && [ "$result" != "" ];then
			sleep 2
			i=0
			while [ $i -le 10 ]
			do
				tz_rj45_state=`nv get rj45_state`
	    			tz_ethwan_actprotl=`nv get ethwan_actprotl`
				tz_eth_curmode=`nv get eth_curmode`
				if [ "$tz_rj45_state" = "working" ]; then
					tz_sim_state=`nv get modem_main_state`
					if [ "$tz_sim_state" = "modem_sim_undetected" ];then
						echo timer > /sys/class/leds/modem_b_led/trigger
						echo 0 > /sys/class/leds/modem_r_led/brightness
					fi		
					break
				elif [ $i = 6 ] && [ "$tz_rj45_state" = "connect" ]; then
					tz_eth_lan=`nv get eth_lan`
					#brctl addif br0 $tz_eth_lan 防止其他有wan口的设备出问题，这里直接写死为eth0
					brctl addif br0 eth0
					tz_sim_state=`nv get modem_main_state`
					if [ "$tz_sim_state" = "modem_sim_undetected" ];then
						echo none > /sys/class/leds/modem_b_led/trigger
						echo 1 > /sys/class/leds/modem_r_led/brightness
					fi
					break	
				else
					i=`expr $i + 1`
				fi
				sleep 1
			done
		fi
	elif [ "$1" == "linkdown" ]; then
		if [ "-$2" == "-pswan" ]; then
			tc_tbf.sh down $def_cid
		fi
		linkdown $2 $3	
		if [ "$2" == "ethwan" ] && [ "$tz_eth_type" == "wan" ] && [ "$result" != "" ];then
			tz_eth_lan=`nv get eth_lan`
			#brctl delif br0 $tz_eth_lan 防止其他有wan口的设备出问题，这里直接写死为eth0
			brctl delif br0 eth0
			tz_sim_state=`nv get modem_main_state`
			if [ "$tz_sim_state" = "modem_sim_undetected" ];then
				echo none > /sys/class/leds/modem_b_led/trigger
				echo 1 > /sys/class/leds/modem_r_led/brightness
			fi
		fi
	fi
fi
