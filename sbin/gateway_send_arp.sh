#!/bin/sh

test_log=`nv get path_log`"te.log"

lan_if=br0

ip=`nv get lan_ipaddr`

arping -U -I $lan_if -c 1 $ip

