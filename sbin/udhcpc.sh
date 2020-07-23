#!/bin/sh
# udhcpc script edited by Tim Riker <Tim@Rikers.org>

path_sh=`nv get path_sh`
. $path_sh/global.sh

echo "Info: udhcpc.sh $1 $2 start" >> $test_log

[ -z "$1" ] && echo "Error: should be called from udhcpc" && exit 1

RESOLV_CONF=$path_conf"/resolv.conf"
#broadcast存在时候，设置BROADCAST
[ -n "$broadcast" ] && BROADCAST="broadcast $broadcast"
#subnet存在时候，设置NETMASK
[ -n "$subnet" ] && NETMASK="netmask $subnet"

deconfig_wan()
{   
    nv set $1"_ip"=0.0.0.0
    nv set $1"_nm"=0.0.0.0
    nv set $1"_gw"=0.0.0.0
    nv set $1"_pridns"=0.0.0.0
    nv set $1"_secdns"=0.0.0.0	
}

get_wan_name()
{
    c_id="0"
	ps_name=`nv get pswan`
	rj45_name=`nv get ethwan`
	wifi_name=`nv get wifiwan`
	case "$1" in
	    $ps_name"1")
            wanname="pswan"	
			c_id="1" ;;
		$ps_name"2")
            wanname="pswan"	
			c_id="2" ;;
		$ps_name"3")
            wanname="pswan"	
			c_id="3" ;;
		$ps_name"4")
            wanname="pswan"	
			c_id="4" ;;
        $rj45_name)
            wanname="ethwan"  ;;
        $wifi_name)
            wanname="wifiwan" ;;		
    esac	
}


case "$1" in
    deconfig)
   		echo "case deconfig "
        ifconfig $interface 0.0.0.0 2>>$test_log
        if [ $? -ne 0 ];then
	        echo "Error: ifconfig $interface 0.0.0.0 failed." >> $test_log
        fi
		deconfig_wan $interface 2>>$test_log
		(router_msg_proxy ipv4 udhcpc.sh >> $test_log 2>&1 || echo "Error: router_msg_proxy ipv4 udhcpc.sh failed." >> $test_log) &
         echo "case deconfig over"
		 
		 step=`nvram_get 2860 step_tmp`
		 if [ "-$step" = "-" ];then
			step=0
		 fi
		 
		 echo "step=$step"
		 
		 step=`expr $step + 1`
		 nv set step_tmp=$step
		 
		 if [ "-$step" = "-3" ];then
			nv set step_tmp=0
		 fi
		 	 
        ;;

    renew|bound)
    	echo "case renew bound"
        
		get_wan_name $interface	
		if [ "-$wanname" == "-ethwan" -o "-$wanname" == "-wifiwan" ]; then
			(router_msg_proxy del_timer $wanname >> $test_log 2>&1 || echo "Error: router_msg_proxy del_timer failed." >> $test_log) &
		fi

        #调用该脚本起udhcp时候，判断interface是否和ethwan匹配，匹配则起ethwan,否则用原interface
		ethwan_tmp=`nv get ethwan`
        sw0_flag=`echo $ethwan_tmp | grep $interface`
        if [ "-${sw0_flag}" != "-" ];then
            interface=${ethwan_tmp}
        fi
		ifconfig $interface $ip $BROADCAST $NETMASK 2>>$test_log
		if [ $? -ne 0 ];then
	        echo "Error: ifconfig $interface $ip $BROADCAST $NETMASK failed." >> $test_log
        fi
		if [ "-$wanname" == "-wifiwan" ]; then
			nv set wifi_state="working"
	    elif [ "-$wanname" == "-ethwan" ]; then
		    #自适应，dhcp获取ip成功则杀死pppoe进程
		    pppoe_pid=`ps | grep -v grep | grep $interface | grep pppoecd | awk '{print $1}'`
			kill $pppoe_pid
			nv set rj45_state="working"
			nv set eth_curmode="dhcp"
	    fi
		
        echo "interface:$interface, ip:$ip, NETMASK:$subnet"
        echo "router:$router"
        echo "dns:$dns"
       
        #set new value to ip, netmask, gateway and dns in nv 
        nv set $interface"_ip"=$ip
        nv set $interface"_nm"=$subnet
        nv set $interface"_gw"=$router
		#set dns to nv
        for i in $dns ; do
            [ -n "$pspridns" ] || { nv set $interface"_pridns"=$i; pspridns="pspridns"; }
            nv set $interface"_secdns"=$i   
        done
			
		#c_id=0则是rj45或WiFi，c_id=default则为用于外网的ps口
        def_cid=`nv get default_cid`
	    if [ "-$c_id" == "-0" -o "-$c_id" == "-$def_cid" ]; then
			(router_msg_proxy ipv4 udhcpc.sh >> $test_log 2>&1 || echo "Error: router_msg_proxy ipv4 udhcpc.sh failed." >> $test_log) &
		else
			#policy router
			wan_pri=`nv get $wanname"_priority"`
			rt_num=`expr $wan_pri \* 10 + $c_id`
			ip rule add from $ip table $rt_num 2>>$test_log
			if [ $? -ne 0 ];then
				echo "Error: ip rule add from $ip table $rt_num failed." >> $test_log
			fi
			ip route add default via $router table $rt_num 2>>$test_log
			if [ $? -ne 0 ];then
				echo "Error: ip route add default via $router table $rt_num failed." >> $test_log
			fi
			ip route flush cache 2>>$test_log
			if [ $? -ne 0 ];then
				echo "Error: ip route flush cache failed." >> $test_log
			fi
	    fi
     
		# notify goahead when the WAN IP has been acquired. --yy
		echo "case renew bound over"
		
        #nv set ppp_status=ppp_connected
		nv set step_tmp=0
		;;
esac



exit 0

