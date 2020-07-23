#! /bin/sh

# log.sh show log messages according to parameter
# $1 is modules, $2 is log level(including debug, err, info)
#


if [ "$1" == "wan_connect" ]; then 
	cat /var/log/messages |grep mainControl |grep $2 > /var/log/webshow_messages
	cat /var/log/messages |grep at-server |grep $2 >> /var/log/webshow_messages
	cat /var/log/messages |grep qmi_app |grep $2 >> /var/log/webshow_messages
	cat /var/log/messages |grep randis |grep $2 >> /var/log/webshow_messages
	
elif [ "$1" == "UFI" ]; then 
  	SUM=0
	FLAH=0
	cat /usr/netlog/misc.log |grep UFIx  |sed 's/.*:\(\[misc]\)UFIx \(.*\)/\2/' > /cache/webtmp.txt	
	if [ -s /etc_ro/web/webshow_messages ];then
		if [ -s /cache/webtmp.txt ];then
			if [ -s /cache/webtmp_bk.txt ];then
				LAST_LINE=`sed -n '$p' /cache/webtmp_bk.txt`
				grep "${LAST_LINE}" /cache/webtmp.txt
				if [ $? -eq 0 ];then
					SUM=0
					while read i
					do
						SUM=`expr $SUM + 1`
						echo "$i"|grep "${LAST_LINE}"
						if [ $? -eq 0 ];then
							FLAG=1;
							break
						fi
					done</cache/webtmp.txt
					if [ ${SUM} -ge 1 -a ${FLAG} -eq 1 ]; then
						sed -i "1,${SUM}d" /cache/webtmp.txt	
						sync
					fi
				fi
			fi
	
			if [ -s /cache/webtmp.txt ];then
				cat /cache/webtmp.txt>>/cache/webtmp_bk.txt

				SUM=`cat /cache/webtmp_bk.txt|wc -l`
				if [ ${SUM} -gt 300 ]; then
					SUM=`expr ${SUM} - 300`
					sed -i "1,${SUM}d" /cache/webtmp_bk.txt
					sync
				fi
				cat /cache/webtmp_bk.txt>/etc_ro/web/webshow_messages
			fi
		fi
	else
		#被清零
		if [ -e /tmp/web_firstent_flag ]; then
			#var中有log
			if [ -s /cache/webtmp.txt ];then
				if [ -s /cache/webtmp_bk.txt ];then
					LAST_LINE=`sed -n '$p' /cache/webtmp_bk.txt`
					grep "${LAST_LINE}" /cache/webtmp.txt
					if [ $? -eq 0 ];then
						SUM=0
						while read i
						do
							SUM=`expr $SUM + 1`
							echo "$i"|grep "${LAST_LINE}"
							if [ $? -eq 0 ];then
								FLAG=1
								break
							fi
						done</cache/webtmp.txt
						if [ ${SUM} -ge 1 -a ${FLAG} -eq 1 ];then
							sed -i "1,${NUM}d" /cache/webtmp.txt
							sync
						fi
					fi
				fi

				cat /cache/webtmp.txt>/cache/webtmp_bk.txt
				SUM=`cat /cache/webtmp_bk.txt|wc -l`
				if [ ${SUM} -gt 300 ]; then
					SUM=`expr ${SUM} - 300`
					sed -i "1,${SUM}d" /cache/webtmp_bk.txt
				fi
				cat /cache/webtmp_bk.txt>/etc_ro/web/webshow_messages

			else 
				if [ -s /cache/webtmp_bk.txt ]; then
					rm /cache/webtmp_bk.txt
				fi
			fi
		########首次进入#######
		else
			if [ -s /cache/webtmp.txt ]; then
				cat /cache/webtmp.txt>/cache/webtmp_bk.txt
				SUM=`cat /cache/webtmp_bk.txt|wc -l`
				if [ ${SUM} -gt 300 ]; then
					SUM=`expr ${SUM} - 300`
					sed -i "1,${SUM}d" /cache/webtmp_bk.txt
				fi
				cat /cache/webtmp_bk.txt>/etc_ro/web/webshow_messages
				touch /tmp/web_firstent_flag
			fi
		fi
			
	fi

	rm  /cache/webtmp.txt
#	rm /tmp/k


	

	

elif [ "$1" == "voip" ]; then 
	cat /var/log/messages |grep voip |grep $2 > /var/log/webshow_messages
	
elif [ "$1" == "sms" ]; then 
	cat /var/log/messages |grep sms |grep $2 > /var/log/webshow_messages
	
elif [ "$1" == "dlna" ]; then 
	cat /var/log/messages |grep fullshare |grep $2 > /var/log/webshow_messages
	cat /var/log/messages |grep USBtest |grep $2 >> /var/log/webshow_messages
	
elif [ "$1" == "tr069" ]; then 
	cat /var/log/messages |grep tr069 |grep $2 > /var/log/webshow_messages
	
elif [ "$1" == "wlan" ]; then 
	cat /var/log/messages |grep wlan-server |grep $2 > /var/log/webshow_messages
	
elif [ "$1" == "router" ]; then 
	cat /var/log/messages |grep dnsmasq |grep $2 > /var/log/webshow_messages
	cat /var/log/messages |grep udhcpd |grep $2 >> /var/log/webshow_messages
	cat /var/log/messages |grep router >> /var/log/webshow_messages

else
	cp /var/log/messages /var/log/webshow_messages
fi

