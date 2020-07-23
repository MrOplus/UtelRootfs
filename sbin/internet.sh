#!/bin/sh
#
# internet.sh,v 10.08.05 2010-08-05 15:00:00
#
# usage: internet.sh
#
path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: internet.sh start" > $test_log
echo "Info: `date +%m-%d %H:%M:%S`" >> $test_log

genSysFiles()
{
	login=`nv get Login`
	pass=`nv get Password`
	echo "$login::0:0:Adminstrator:/:/bin/sh" > /etc/passwd
	echo "$login:x:0:$login" > /etc/group
	echo "$login:$pass" > /tmp/tmpchpw
	chpasswd < /tmp/tmpchpw
	rm -f /tmp/tmpchpw
}
user_login=`cat /etc/passwd | grep admin`
#user_login不存在或为空时候执行函数genSysFiles
[ -n "$user_login" ] || { genSysFiles;}

safe_run()
{
	ps > ${test_log}/ps.tmp
	flag=`grep -w "$1" ${test_log}/ps.tmp`
	if [ "-${flag}" = "-" ];then
		$1 &
	fi
	rm -rf ${test_log}/ps.tmp
}

#动态nv置空
#. $path_sh/cfgnv_init.sh
pswan=`nv get pswan`
ethwan=`nv get ethwan`
wifiwan=`nv get wifiwan`
echo 0 > /proc/sys/net/ipv6/conf/$pswan"1"/accept_ra
echo 0 > /proc/sys/net/ipv6/conf/$pswan"2"/accept_ra
echo 0 > /proc/sys/net/ipv6/conf/$pswan"3"/accept_ra
echo 0 > /proc/sys/net/ipv6/conf/$pswan"4"/accept_ra
echo 0 > /proc/sys/net/ipv6/conf/$ethwan/accept_ra
echo 0 > /proc/sys/net/ipv6/conf/$wifiwan/accept_ra

#EC 设置连接跟踪最大值
echo 7248 > /proc/sys/net/nf_conntrack_max
echo 7200 > /proc/sys/net/netfilter/nf_conntrack_tcp_timeout_established

#zte_mainctrl &

#将br_name,usblan_name传给内核实现平台化
fast_usb=`nv get fast_usb`
lan_enable=`nv get LanEnable`

#LanEnable为2时候没有br，不需要写br_name
if [ "$lan_enable" != "2" ]; then
    echo $lan_if > /proc/net/br_name
fi

echo $fast_usb > /proc/net/usb_name

#br0搭建，及内网dhcp
sh $path_sh/lan.sh

#将快速转发级别传给内核
fastnat_level=`nv get fastnat_level`
echo "Info: set fastnat_level：$fastnat_level" >> $test_log
echo $fastnat_level > /proc/net/fastnat_level

#将不支持快速转发的协议端口号传给内核
nofast_port=`nv get nofast_port`
echo "Info: set nofast_port：$nofast_port" >> $test_log
echo $nofast_port > /proc/net/nofast_port

killall -9 miniupnpd
rm -rf $path_conf/inadyn.status

#
#初始化时一次性设置各种模块变量值。
#相应的配置文件在/etc_ro/net_debug.conf
#
while read i
do
    MYKEY=`echo $i|awk 'BEGIN{FS="="}{print $1}'`
    MYVALUE=`echo $i|awk 'BEGIN{FS="="}{print $2}'`
    echo "${MYVALUE}">/sys/module/net_ext_modul/parameters/${MYKEY}
done</etc_ro/net_debug.conf

#记录进程被何种信号killed掉
netdog -s exitsig=1

#监控内核skb相关信息的最大值
safe_run netmonitor

#监控内核的netlink事件存文件，支持内核自定义事件，因会写flash版本默认关闭
#safe_run event_proc
