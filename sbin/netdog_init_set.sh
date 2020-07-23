#!/bin/sh
#
#
path_conf=`nv get path_conf`
test_log=`nv get path_log`"te.log"

br_ipchange_flag=`nv get br_ipchange_flag`
leak_set_flag=`nv get leak_set_flag`

leak_full_panic=`nv get leak_full_panic`
skb_max_panic=`nv get skb_max_panic`
skb_max_fail=`nv get skb_max_fail`
leak_list_max=`nv get leak_list_max`
debug_mode=`nv get debug_mode`

if [ "${leak_list_max}" != "" ]; then
    netdog -s 'leak_list_max='${leak_list_max} &
	echo "Info: netdog -s 'leak_list_max='${leak_list_max}" >> $test_log
fi
if [ "${skb_max_panic}" != "" ]; then
    netdog -s 'skb_max_panic='${skb_max_panic} &
	echo "Info: netdog -s 'skb_max_panic='${skb_max_panic}" >> $test_log
fi
if [ "${skb_max_fail}" != "" ]; then
    netdog -s 'skb_max_fail='${skb_max_fail} &
	echo "Info: netdog -s 'skb_max_fail='${skb_max_fail}" >> $test_log
fi
if [ "${leak_full_panic}" != "" ]; then
    netdog -s 'leak_full_panic='${leak_full_panic} &
	echo "Info: netdog -s 'leak_full_panic='${leak_full_panic}" >> $test_log
fi
if [ "$br_ipchange_flag" != "" ]; then
    netdog -s 'brip='$br_ipchange_flag &
	echo "Info: netdog -s 'brip='$br_ipchange_flag" >> $test_log
fi
if [ "${leak_set_flag}" != "" ]; then
    netdog -s 'leak='${leak_set_flag} &
	echo "Info: netdog -s 'leak='${leak_set_flag}" >> $test_log
fi
if [ "${debug_mode}" == "zephyr" ]; then
    7100_ip_proxy &
	echo "Info: debug_mode 'debug_mode='${debug_mode}" >> $test_log
fi
