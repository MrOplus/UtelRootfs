#!/bin/sh
#
# $Id: config-dns.sh, v10.08.05, 2010-08-05 15:00:00
#
# usage: config-dns.sh [<dns1>] [<dns2>]
#
path_sh=`nv get path_sh`
. $path_sh/global.sh
echo "Info: config-dns.sh $1 $2 start" >> $test_log
fname=$path_conf"/etc/resolv.conf"
fbak=$path_conf"/etc/resolv_conf.bak"

# in case no previous file
touch $fname

# backup file without nameserver part
sed -e '/nameserver/d' $fname > $fbak

# set primary and seconday DNS
if [ "x$1" != "x" ]; then
  echo "nameserver $1" > $fname
else # empty dns
  rm -f $fname
fi
if [ "x$2" != "x" ]; then
  echo "nameserver $2" >> $fname
fi

cat $fbak >> $fname
rm -f $fbak

