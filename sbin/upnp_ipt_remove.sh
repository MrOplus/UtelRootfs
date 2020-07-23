#! /bin/sh
# $Id: iptables_removeall.sh,v 1.1 2008-09-15 12:28:53 winfred Exp $

path_sh=`nv get path_sh`
. $path_sh/global.sh

echo "Info: upnp_ipt_remove.sh start" >> $test_log

IPTABLES=iptables

#change this parameters :
EXTIF="$defwan_rel"

#removing the MINIUPNPD chain for nat
$IPTABLES -t nat -F MINIUPNPD
#removing the rule to MINIUPNPD
#$IPTABLES -t nat -D PREROUTING -d $EXTIP -i $EXTIF -j MINIUPNPD
$IPTABLES -t nat -D PREROUTING -i $EXTIF -j MINIUPNPD
$IPTABLES -t nat -X MINIUPNPD

#removing the MINIUPNPD chain for filter
$IPTABLES -t filter -F MINIUPNPD
#adding the rule to MINIUPNPD
$IPTABLES -t filter -D FORWARD -i $EXTIF -o ! $EXTIF -j MINIUPNPD
$IPTABLES -t filter -X MINIUPNPD
