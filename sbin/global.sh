#!/bin/sh

#
#该脚本用于获取一些通用的nv变量及定义公共函数使用
#

####获取通用nv变量####
path_conf=`nv get path_conf`
test_log=`nv get path_log`"te.log"
path_tmp=`nv get path_tmp`

##getLanIfName
lan_if=`nv get lan_name`
#echo "LanIfName=$lan_if"

##getWanIfName
pswan_name=`nv get pswan`
def_cid_tmp=`nv get default_cid`
pswan_if=$pswan_name$def_cid_tmp
ethwan_if=`nv get ethwan`
wifiwan_if=`nv get wifiwan`
		
#ipv4
defwan_if=`nv get default_wan_name`
defwan_rel=`nv get default_wan_rel`
	
#ipv6
defwan6_if=`nv get default_wan6_name`
defwan6_rel=`nv get default_wan6_rel`


####公共函数####
#查找对应dhcpc进程号并杀死
udhcpc_kill()
{
	ps > ${path_tmp}/udhcpc.sh.$$
	udhcpc_pid=`awk 'BEGIN{temp1="'"${wan_if}"'";temp2="'$path_sh/udhcpc.sh'"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/udhcpc.sh.$$`
	rm -f ${path_tmp}/udhcpc.sh.$$
	[ -n "$udhcpc_pid" ] && { kill -9 $udhcpc_pid; echo "Info: kill udhcpc $udhcpc_pid " >> $test_log ; }
}
#查找对应pppoe进程号并杀死
pppoe_kill()
{
	ps > ${path_tmp}/pppoecd.${wan_if}.$$
	pppoe_pid=`awk 'BEGIN{temp1="'"${wan_if}"'";temp2="pppoecd"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/pppoecd.${wan_if}.$$`
	rm -f ${path_tmp}/pppoecd.${wan_if}.$$
	[ -n "$pppoe_pid" ] && { kill -9 $pppoe_pid; echo "Info: kill pppoecd $pppoe_pid " >> $test_log ; }
}
#查找对应dhcp6s进程号并杀死
dhcp6s_kill()
{
	ps > ${path_tmp}/${dhcp6s_conf##*/}.$$
	dhcp6s_pid=`awk 'BEGIN{temp1="'"${dhcp6s_conf}"'";temp2="dhcp6s"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/${dhcp6s_conf##*/}.$$`
	rm -f ${path_tmp}/${dhcp6s_conf##*/}.$$
    [ -n "$dhcp6s_pid" ] && { kill -9 $dhcp6s_pid; echo "Info: kill dhcp6s $dhcp6s_pid " >> $test_log ; }
}

#查找对应radvd进程号并杀死
radvd_kill()
{
	ps > ${path_tmp}/${radvd_conf##*/}.$$
	radvd_pid=`awk 'BEGIN{temp1="'"${radvd_conf}"'";temp2="radvd"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/${radvd_conf##*/}.$$`
	rm -f ${path_tmp}/${radvd_conf##*/}.$$
    [ -n "$radvd_pid" ] && { kill -9 $radvd_pid; echo "Info: kill radvd $radvd_pid " >> $test_log ; }
}

#查找对应dhcp6c进程号并杀死
dhcp6c_kill()
{
	ps > ${path_tmp}/dhcp6c.${wan_if}.$$
	dhcp6c_pid=`awk 'BEGIN{temp1="'"${wan_if}"'";temp2="dhcp6c"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/dhcp6c.${wan_if}.$$`
	rm -f ${path_tmp}/dhcp6c.${wan_if}.$$
    [ -n "$dhcp6c_pid" ] && { kill -9 $dhcp6c_pid; echo "Info: kill dhcp6c $dhcp6c_pid " >> $test_log ; }
}

#查找对应ndp进程号并杀死
ndp_kill()
{
	ps > ${path_tmp}/${ndp_log##*/}.$$
	ndp_pid=`awk 'BEGIN{temp1="'"${ndp_log}"'";temp2="zte_ndp"}{if(index($0,temp1)>0 && index($0,temp2)>0){print $1}}' ${path_tmp}/${ndp_log##*/}.$$`
	rm -f ${path_tmp}/${ndp_log##*/}.$$
    [ -n "$ndp_pid" ] && { kill -9 $ndp_pid; echo "Info: kill ndp $ndp_pid " >> $test_log ; }
}

