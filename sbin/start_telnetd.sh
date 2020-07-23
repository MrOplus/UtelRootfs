#!/bin/sh

flag=`nv get telnetd_enable`

if [ "$flag" == "y" ]; then
    echo "Starting telnetd......!"
    /usr/sbin/telnetd -p 4719 & 
fi


