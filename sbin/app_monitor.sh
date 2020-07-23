#!/bin/sh
if [ "-$1" == "-open" -o "-$1" == "-off" ]; then
	app_monitor=`nv get monitor_apps`
	echo "$1 $app_monitor" > /proc/abnormal_exit_task
else
	echo "Usage: app_monitor.sh open\/off"
fi
