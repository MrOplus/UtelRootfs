#!/bin/sh

path_sh=`nv get path_sh`
. $path_sh/global.sh

checkbrctl()
{
    mode=$1
    wan_if=$2  #wan_if(ps) or ethlan(rj45)
    psext_if=$3
    if [ "-${mode}" = "-ps" ];then
        br_wan=`brctl show|grep $wan_if`
        if [ "$?" == "0" -a "$br_wan" == "" ]; then
		    brctl show
            echo -e "\033[1m $br_wan not added in br0, please connect [ddrnet driver team] \033[0m"
            return 0
        fi    
        br_psext=`brctl show|grep $psext_if`
        if [ "$?" == "0" -a "$br_psext" == "" ]; then 
		    brctl show
            echo "\033[1m $br_psext not added in br0, if you have plugin the usb, please connect [main ctrl team] \033[0m"
            return 0
        fi
        echo " "
    elif [ "-${mode}" = "-rj45" ];then
        br_rj45=`brctl show|grep $wan_if`
        #是否加入网桥
        if [ "$?" == "0" -a "$br_rj45" == "" ]; then 
		    brctl show
            echo "lan rj45 device is not added in br0, if you have plugin the rj45 as lan, please connect [main ctrl team]"
        fi
    fi
    return 0
}

checkroute()
{
    #缺省路由
    route_state=`route | grep default`
    if [ "$route_state" == "" ]; then
		echo "			########  Route   INFO   ########"
        echo "err!there is no default route,pls connect [network team]"
    fi
    return 0
}

checkdhcpdfile()
{
    ps > ${path_tmp}/udhcpd.$$
    udhcpc_file=`awk 'BEGIN{temp1="udhcpd";}{if(index($0,temp1)>0){print $NF}}' ${path_tmp}/udhcpd.$$`
    if [ "$udhcpc_file" == "" ]; then
        echo "err dhcpd is nor running !!!!!"
    else
        cat $udhcpc_file
    fi
    rm -f ${path_tmp}/udhcpd.$$
    return 0
}

rj45_connect_info()
{
            pppoe_user=`nv get pppoe_username`
            pppoe_pass=`nv get pppoe_password`
            #rj45此时为WAN口
            if [ "$ethwan_mode" == "auto" ]; then
                ps_pppoe=`ps | grep -v grep | grep pppoe`
                ps_dhcp=`ps | grep -v grep | grep dhcpc`

                #pppoe进程不在运行
                if [ "$ps_pppoe" == "" ]; then
                    echo "pppoe is not running, if you plugin rj45,please connect [softap/network team]"
                    #显示插拔或拨号信息
                    cd /
                else 
                    if [ "$pppoe_user" == "" -o "$pppoe_pass" == "" ]; then
                        echo -e "\033[1m PPPoe username or password is not set, please check them!!!!!\033[0m"
                    else
                        echo -e "\33[1m 1、please check if the user and password is correct\n
                            2pppoec $ps_pppoe is asking for IP from server， please wait for 1 minite33[0m"
                    fi
                fi
                #dhcp进程不在运行
                if [ "$ps_dhcp" == "" ]; then
                    echo "dhcp is not running, if you plugin rj45,please connect softap/network team"
                    cd /
                else
                    echo -e "\33[1m dhcpc is asking for IP from server， please wait for 1 minite \033[0m"
                fi
            elif [ "$ethwan_mode" == "pppoe" ]; then
                ps_pppoe=`ps | grep -v grep | grep pppoe`

                if [ "$ps_pppoe" == "" ]; then
                    echo "pppoe is not running,if you plugin rj45, please connect [softap/network team]"
                    cd /
                else 
                    if [ "$pppoe_user" == "" -o "$pppoe_pass" == "" ]; then
                        echo -e "\033[1m PPPoe username or password is not set, please check them!!!!!\033[0m"
                    else
                        echo -e "\33[1m 1、please check if the user and password is correct\n
                            2pppoec $ps_pppoe is asking for IP from server， please wait for 1 minite33[0m"
                    fi
                fi
            elif [ "$ethwan_mode" == "dhcp" ]; then
                ps_dhcp=`ps | grep -v grep | grep dhcpc`
                if [ "$ps_dhcp" == "" ]; then
                    echo "dhcp is not running, if you plugin rj45,please connect [softap/network team]"
                    cd /
                else
                    echo -e "\33[1m dhcpc is asking for IP from server， please wait for 1 minite \033[0m"
                fi
            fi    

}

check_devstat()
{
    devname=$1
	devstatfile=`nv get devstatfile`
	Filelist=`ls ${devstatfile}* | sort -r`
	#文件列表不存在，说明未记录任何插拔信息
	if [ "-$Filelist" = "-" ];then
	    return 0
	#devname为空时候，检测所有的插拔信息并提示
	elif [ "-$devname" = "-" ];then
	    #根据devstat文件中的信息，获取所有记录热插拔的设备名最后一次记录的up/down状态
		echo ""
        echo "The last hotplug status as below:"
		cat ${Filelist} | awk '{key[$2]=$3;}END{for(temp in key){print temp" "key[temp]}}'
		echo ""
	    echo "if the device you plugin is not up, please connect [main ctrl team]"
	    echo ""
	else
	    cat $Filelist | grep ${devname} > ${path_tmp}/netdog.tmp
		status=`awk 'END{print $3}' ${path_tmp}/netdog.tmp`
		if [ "-${status}" = "-UP" -o "-${status}" = "-online" ];then
		    echo ""
		    echo "Hotplug status for ${devname}: UP"
		    echo ""
		elif [ "-${status}" = "-DOWN" ];then
		    echo ""
		    echo "Hotplug status for ${devname}: DOWN"
		    echo ""
		fi
	fi
	
	return 0
}

ping_url()
{
	echo "############## PING $1 $2 $3################"
	array="$1 $2 $3"
    
    PACKETTIMES=5
    flag=0
    TMP=${path_tmp}/pingwantmp     
    for var in $array;
    do	
	    > ${TMP} 

        #ping5次，检测丢包率
	    ping -c ${PACKETTIMES} -s 32 $var  >> ${TMP}     
	    WANLOST=`grep loss ${TMP} |awk -F "%" '{print$1}'|awk '{print $NF}' `         
        rm -rf ${TMP}	
	
	    if [ "$WANLOST" == "100" ]; then
        	echo "ping $var failed, if you ensure have wan ip, and ensure the server you ping is ok,pls connct[modem team]"
    	elif [ "$WANLOST" == "0" ]; then
        	echo "ping $var success"
        	flag=1
    	elif [ "$WANLOST" == "" ]; then
		    echo "seems do not have WAN Interface, please check if PDP ACT,if you have pdp act,please connect [AT Server]"
	    elif [ "$WANLOST" -lt "100" ]; then
        	echo "packet loss or delay, not care"
        	flag=1
	    fi
    done

    if [ $flag -eq 0 ];then
        echo "ping $array  all failed, if you ensure have PDP act or plugin, please continue!!!"
    fi
}

check_ps()
{
	flag=0
	LANENABLE=`nv get LanEnable`
	ETHCURMOD=`nv get eth_curmode`

	ps aux > ${path_tmp}/checkps.tmp

	
	while read item 
	do
		udhcpc_pid=`awk 'BEGIN{temp1="'"${item}"'";}{if(index($0,temp1)>0){printf $1}}' ${path_tmp}/checkps.tmp`
		if [ "-${udhcpc_pid}" == "-" ];then
			if [ $flag -eq 0 ];then
				echo
				echo "	########network Process Info###########"
				flag=1
			fi
			echo "${item} is not running!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
			if [ x"${item}" = x"zte_mainctrl" ]; then
				echo "if you ensure must run zte_mainctrl ,please connect with [network team]."
			elif [ x"${item}" = x"goahead" ]; then
				echo "if you ensure must run goahead ,please connect with dai.chengyang."
			elif [ x"${item}" = x"udhcpd" -a \( x"${LANENABLE}" = x"1" -o x"${LANENABLE}" = x"2" \) ]; then
				echo "if you ensure must run udhcpd ,please connect with Wang.Ming."		
			elif [ x"${item}" = x"dnsmasq" -a \( x"${LANENABLE}" = x"1" -o x"${LANENABLE}" = x"2" \) ]; then
				echo "if you ensure must run dnmasq,please connect with Wang.Ming."		
			elif [ x"${item}" = x"pppoe" -a \( x"${ETHCURMOD}" = x"pppoe" -o x"${ETHCURMOD}" = x"" \) ]; then
				echo "if you ensure must run pppoe,please connect with Wang.Ming."		
			fi
		fi
	done<<-COMLEE
		zte_mainctrl
		goahead
		udhcpd
		dnsmasq
		pppoe
	COMLEE

	rm -f ${path_tmp}/checkps.tmp
}

kill_progress()
{
	echo "enter kill progress"
	name=$1
	ps > ${path_tmp}/ps_info
      	progress_pid=`awk 'BEGIN{temp1="'"${name}"'";}{if(index($0,temp1)>0 ){print $1}}' ${path_tmp}/ps_info`
	echo "pid is $progress_pid"   	
	rm -f ${path_tmp}/ps_info
   	if [ -n "$progress_pid" ]; then 
		kill -USR1 $progress_pid
	else
		echo "please check progress name $name!"
	fi
}

if [ "$1" == "checkbrctl" ]; then
    checkbrctl $2 $3 $4
elif [ "$1" == "checkroute" ]; then
    checkroute
elif [ "$1" == "checkdhcpdfile" ]; then
    checkdhcpdfile
elif [ "$1" == "rj45_connect_info" ]; then
    rj45_connect_info
elif [ "$1" == "ping_url" ]; then
    ping_url $2 $3 $4
elif [ "$1" == "check_ps" ]; then
    check_ps
elif [ "$1" == "kill_progress" ]; then
    kill_progress $2
fi

