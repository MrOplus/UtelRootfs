#!/bin/sh
#
# $Id: start_tr069.sh
#
tr069_enable=`nv get tr069_app_enable`

if [ "$tr069_enable" == "y" ]; then
echo "tr069_enable = y"
echo "at_main start tr069, delay 30s"
sleep 30
killall -9 tr069
tr069 &
echo "tr069 started"
exit
else
echo "tr069_enable = n"
exit
fi


