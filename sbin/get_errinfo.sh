#!/bin/sh

line=`grep "^$1" -n /sbin/app_errmsg.txt | awk -F: '{print $1}'`
awk -F= -v c=$2 -v n=$line '(NR - n == c) {print $2}' /sbin/app_errmsg.txt
