#!/bin/sh

# fota升级后相关nv更新，仅限fota升级后第一次开机
fota_flag=$(cat /cache/zte_fota/update_status)
if [ $fota_flag != "2" ]; then
    exit 0
fi

# mtu升级
#nv_mtu=$(cat /securefs/default_parameter_user | grep -w "mtu")
#mtu=${nv_mtu##*mtu=}
#mtu=${mtu%% *}
#echo nv_mtu: $nv_mtu, mtu: $mtu
#nv set mtu=$mtu

# 打印级别升级
nv_print_level=$(cat /securefs/default_parameter_user | grep -w "print_level")
print_level=${nv_print_level##*print_level=}
print_level=${print_level%% *}
echo nv_print_level: $nv_print_level, print_level: $print_level
nv set print_level=$print_level

nv save
