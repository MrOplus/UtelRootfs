#! /bin/sh
# $Id: iptables_init.sh,v 1.1 2008-09-15 12:28:53 winfred Exp $

path_sh=`nv get path_sh`
. $path_sh/global.sh

echo "Info: upnp_ipt_init.sh start" >> $test_log
IPTABLES=iptables

#change this parameters :
EXTIF=$defwan_rel

#adding the MINIUPNPD chain for nat
$IPTABLES -t nat -N MINIUPNPD
#adding the rule to MINIUPNPD
#$IPTABLES -t nat -A PREROUTING -d $EXTIP -i $EXTIF -j MINIUPNPD
$IPTABLES -t nat -I PREROUTING -i $EXTIF -j MINIUPNPD

#adding the MINIUPNPD chain for filter
$IPTABLES -t filter -N MINIUPNPD
#adding the rule to MINIUPNPD
$IPTABLES -t filter -I FORWARD -i $EXTIF -o ! $EXTIF -j MINIUPNPD
