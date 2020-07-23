#!/bin/sh
#
# $Id: lan.sh
#

update_type=`nv get update_type`
fota_dm_vendor=`nv get fota_dm_vendor`
if [ "$update_type" == "mifi_local" ]; then
    echo "update_type: mifi_local"
fi

if [ "$update_type" == "mifi_fota" ]; then
    echo "update_type: mifi_fota"
	if [ "$fota_dm_vendor" == "zx" ]; then
		fota_dm_zx &
	else
		fota_dm_gs &
	fi
fi

if [ "$update_type" == "mdl_local" ]; then
    echo "update_type: mdl_local"
	localUpdate &
fi

if [ "$update_type" == "mdl_fota" ]; then
    echo "update_type: mdl_fota"
	if [ "$fota_dm_vendor" == "zx" ]; then
		fota_dm_zx &
	else
		fota_dm_gs &
	fi
fi

if [ "$update_type" == "none" ]; then
    echo "update_type: none"
fi