#!/bin/sh

path_sh=`nv get path_sh`
echo "Info: pppoe_updown.sh $1 start " >> $test_log
wan_if=`nv get ethwan`
. $path_sh/global.sh

pppoe_down()
{
	nv set rj45_state="idle"
    #killall pppoecd
	(/sbin/router_msg_proxy ipv4 pppoe_updown.sh 1>> $test_log 2>&1 || echo "Error: router_msg_proxy ipv4 pppoe_updown.sh failed." >> $test_log) &
	if [ $? -ne 0 ];then
	    echo "Error: router_msg_proxy ipv4 failed." >> $test_log
    fi
}
pppoe_up()
{
    udhcpc_kill
	nv set rj45_state="working"
	nv set eth_curmode="pppoe"
	(/sbin/router_msg_proxy del_timer ethwan 1>> $test_log 2>&1 || echo "Error: router_msg_proxy del_timer failed." >> $test_log) &
	if [ $? -ne 0 ];then
	    echo "Error: router_msg_proxy del_timer failed." >> $test_log
    fi
	(/sbin/router_msg_proxy ipv4 pppoe_updown.sh 1>> $test_log 2>&1 || echo "Error: router_msg_proxy ipv4 pppoe_updown.sh failed." >> $test_log) &
	if [ $? -ne 0 ];then
	    echo "Error: router_msg_proxy ipv4 failed." >> $test_log
    fi
	
	wan_ip=`nv get $wan_if"_ip"`
    wan_gw=`nv get $wan_if"_gw"`
	wan_pri=`nv get ethwan_priority`
	rt_num=`expr $wan_pri \* 10 `
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
}

if [ "$1" == "up" ]; then
    pppoe_up
elif [ "$1" == "down" ]; then
    pppoe_down
fi
    