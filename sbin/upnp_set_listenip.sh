#! /bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh

echo "Info: upnp_set_listenip.sh start" >> $test_log

if [ -f $path_conf/miniupnpd.conf ]
	then
		echo "/mnt/jffs2/etc/miniupnpd.conf already exist!"
fi

conf_file=$path_conf/miniupnpd.conf

listening_ip=$(grep listening_ip= $conf_file)
aim="listening_ip=$1"
sed -i "s:$listening_ip:$aim:g" $conf_file
ip=`nv get lan_ipaddr`
sed  -i -e "s/#allow_ip#/$ip/g" $conf_file
name=`nv get device_name`
sed  -i -e "s/#device_name#/$name/g" $conf_file
