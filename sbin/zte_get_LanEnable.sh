#!/bin/sh
#
# $Id: lan.sh
#

lan_enable=`nv get LanEnable`

if [ "$lan_enable" == "0" ]; then
    echo "LanEnable = 0"
	exit 0
else
	echo "LanEnable = 1"
    exit 1
fi