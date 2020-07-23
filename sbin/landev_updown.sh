#!/bin/sh
path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: landev_updown.sh $1 $2 start" >> $test_log
lan_enable=`nv get LanEnable`

xgw_lan()
{
	. $path_sh/xjz_init.sh                       
	xgwlan=`nv get lan_name`
	real_gw=`nv get  lan_ipaddr`
	real_nm=`nv get  lan_netmask`
	ifconfig $xgwlan down
	ifconfig $xgwlan $real_gw netmask $real_nm up
	if [ $? -ne 0 ];then
		echo "Error: ifconfig $xgwlan $real_gw netmask $real_nm up failed." >> $test_log
	fi
		
	echo "stop gtp_proxy .... " >> $test_log
	killall -9 gtp_proxy
	gtp_proxy &                    
	echo "start gtp_proxy .... " >> $test_log   
}

landev_up()
{
	if [ "-$1" == "-ethwan" ]; then
		(router_msg_proxy del_timer ethwan 1>> $test_log 2>&1 || echo "Error: router_msg_proxy del_timer failed." >> $test_log) &
	fi
	landev_name=`nv get $1`
	if [ "-$lan_enable" == "-2" ]; then
		
			ip=`nv get lan_ipaddr`
			nm=`nv get lan_netmask`
			ifconfig $landev_name $ip netmask $nm up 2>>$test_log
			if [ $? -ne 0 ];then
				echo "Error: ifconfig $lan_if $ip netmask $nm failed." >> $test_log
			fi

	else
		br_name=`nv get lan_name`
		ifconfig $landev_name down 2>>$test_log
		if [ $? -ne 0 ];then
			echo "Error: ifconfig $landev_name down failed." >> $test_log
		fi
		ifconfig $landev_name up 2>>$test_log
		if [ $? -ne 0 ];then
			echo "Error: ifconfig $landev_name up failed." >> $test_log
		fi
		brctl addif $br_name $landev_name 

	fi
}

landev_down()
{
	landev_name=`nv get $1`	
	ifconfig $landev_name down 2>>$test_log
	if [ $? -ne 0 ];then
		echo "Error: ifconfig $landev_name down failed." >> $test_log
	fi
	if [ "-$lan_enable" == "-1" ]; then
		br_name=`nv get lan_name`
		brctl delif $br_name $landev_name 2>>$test_log
		if [ $? -ne 0 ];then
			echo "Error: brctl delif $br_name $landev_name" >> $test_log
		fi
	fi
    if [ "-$lan_enable" == "-2" ]; then
        ps > ${path_tmp}/landev_updown.sh.$$
	    udhcpd_pid=`awk 'BEGIN{temp1="'"${landev_name}"'";temp2="'dhcpd'"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/landev_updown.sh.$$`
	    rm -f ${path_tmp}/landev_updown.sh.$$
	    [ -n "$udhcpd_pid" ] && { kill $udhcpd_pid; echo "Info: kill udhcpd $udhcpd_pid " >> $test_log ; }
    fi
}

get_cid()
{
	ps_ext_cid=$1
	c_id=${ps_ext_cid##ps_ext}
}

ps_ext_up()
{
	landev_name=`nv get $1`
	get_cid $1
    landev_name=`nv get $1`
	get_cid $1
    br="br"$c_id
    br_ip6=`nv get $br"_ipv6_ip"`
    up_flag="0"
    if [ "-$br_ip6" != "-" -a "-$br_ip6" != "-::" ]; then
        up_flag="1"
    fi
    br_ip=`nv get $br"_ip"`
    if [ "-$br_ip" != "-" -a "-$br_ip" != "-0.0.0.0" ]; then
        up_flag="1"
    fi
    if [ "-$up_flag" == "-1" ]; then
        ifconfig $landev_name up 2>>$test_log
        if [ $? -ne 0 ];then
            echo "Error: ifconfig $landev_name up failed." >> $test_log
        fi
    fi
}

ps_ext_down()
{
    landev_name=`nv get $1`
    ifconfig $landev_name down 2>>$test_log
    if [ $? -ne 0 ];then
        echo "Error: ifconfig $landev_name down failed." >> $test_log
    fi
}

if [ "-$1" == "-ethlan" -o "-$1" == "-wifilan" -o "-$1" == "-wifilan2" -o "-$1" == "-usblan" -o "-$1" == "-ethwan" ]; then
	if [ "-$2" == "-up" ]; then
		landev_up $1
	else 
		landev_down $1
	fi
else #ps_ext
	ps_ext_state=`nv get $1"_pdpstate"`
	if [ "-$ps_ext_state" == "-working" ]; then
		if [ "-$2" == "-up" ]; then
			ps_ext_up $1
		else
			ps_ext_down $1
		fi
	fi
fi