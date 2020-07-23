#!/bin/sh

# 此角度用于客户定制功能

# 为国电定制，如果是国电，强行初始化国电相关NV，需要在相关应用启动前
customer_type=$(nv get customer_type)
if [ x"${customer_type}" == x"guodian" ];then
    # fota
    nv set fota_updateMode=0
    nv set pwron_auto_check=0
    # mmi
    nv set mmi_showmode=led
    nv set mmi_task_tab=net_task+ctrl_task
    nv set mmi_led_mode=sleep_mode
    zte_mmi &
    # uart
    nv set self_adaption_port=/dev/ttyS0
elif [ x"${customer_type}" == x"nandian" ]; then
    # fota
    nv set fota_updateMode=0
    nv set pwron_auto_check=0
    # mmi
    nv set mmi_showmode=led
    nv set mmi_task_tab=net_task+ctrl_task+key_task
    nv set mmi_led_mode=sleep_mode
    zte_mmi &
    # uart
    nv set self_adaption_port=/dev/ttyS0
fi
