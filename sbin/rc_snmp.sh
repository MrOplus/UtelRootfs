#!/bin/sh
#set -x

SNMP_CONF="/tmp/snmpd.conf"

snmp_enable=$(nv get tz_snmp_enable)
if [ "${snmp_enable}" != "yes" ]; then
	exit 0
fi

snmp_port=$(nv get snmp_port)
snmp_rocommunity=$(nv get snmp_rocommunity)
snmp_rwcommunity=$(nv get snmp_rwcommunity)

if [ "${snmp_port}" = "" ]; then
	snmp_port=161
fi

if [ "${snmp_rocommunity}" = "" ]; then
	snmp_rocommunity=public
fi

if [ "${snmp_rocommunity}" = "" ]; then
	snmp_rocommunity=private
fi

echo "agentAddress udp:${snmp_port}" > ${SNMP_CONF}
echo "rocommunity ${snmp_rocommunity}" >> ${SNMP_CONF}
echo "rwcommunity ${snmp_rwcommunity}" >> ${SNMP_CONF}

snmpd -c ${SNMP_CONF}
