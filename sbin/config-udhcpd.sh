#!/bin/sh
#
# $Id: config-udhcpd.sh,v 1.10 2010-06-18 06:33:21 steven Exp $
#
# usage: see function usage()

path_sh=`nv get path_sh`
. $path_sh/global.sh

dhcp_type=$1

usage () {
  echo "usage: config-udhcpd.sh [option]..."
  echo "options:"
  echo "  -h              : print this help"
  echo "  -s ipaddr       : set ipaddr as start of the IP lease block"
  echo "  -e ipaddr       : set ipaddr as end of the IP lease block"
  echo "  -i ifc          : set ifc as the interface that udhcpd will use"
  echo "  -d dns1 [dns2]  : set dns1 and dns2 as DNS"
  echo "  -m mask         : set mask as subnet netmask"
  echo "  -g gateway      : set gateway as router's IP address"
  echo "  -t time         : set time seconds as the IP life time"
  echo "  -r [sleep_time] : run dhcp server"
  echo "  -k              : kill the running dhcp server"
  echo "  -S [mac ipaddr] : statically assign IP to given MAC address"

  exit
}

config () {
  case "$1" in
    "-s")
      sed -e '/start/d' $fname > $fbak
      echo "start $2" >> $fbak ;;
    "-e")
      sed -e '/end/d' $fname > $fbak
      echo "end $2" >> $fbak ;;
    "-i")
      sed -e '/interface/d' $fname > $fbak
      echo "interface $2" >> $fbak ;;
	"-p")
      sed -e '/pidfile/d' $fname > $fbak
      echo "pidfile $2" >> $fbak ;;
	"-l")
      sed -e '/lease_file/d' $fname > $fbak
      echo "lease_file $2" >> $fbak ;;
    "-d")
      sed -e '/option *dns/d' $fname > $fbak
      echo "option dns $2 $3" >> $fbak ;;
    "-m")
      sed -e '/option *subnet/d' $fname > $fbak
      echo "option subnet $2" >> $fbak ;;
    "-g")
      sed -e '/option *router/d' $fname > $fbak
      echo "option router $2" >> $fbak ;;
    "-t")
      sed -e '/option *lease/d' $fname > $fbak
      echo "option lease $2" >> $fbak ;;
    "-S")
      if [ "$2" = "" ]; then
        sed -e '/static_lease/d' $fname > $fbak
      elif [ "$3" = "" ]; then
	echo "insufficient arguments.."
	usage
      else
        sed -e "/$2/d" $fname > $fbak
        echo "static_lease $2 $3" >> $fbak
		cat $fbak > $fname
		rm -f $fbak
		sed -e "/$2/d" $fname_static > $fbak_static
        echo "$2 $3" >> $fbak_static
		cat $fbak_static > $fname_static
		rm -f $fbak_static
	return
      fi
      ;;
    "-x")
      sed -e '/static_netmask/d' $fname > $fbak
      echo "static_netmask $2" >> $fbak ;;
    "-y")
      sed -e '/static_router/d' $fname > $fbak
      echo "static_router $2" >> $fbak ;;
	"-D")
      sed -e "/$2/d" $fname > $fbak 
	  sed -e "/$2/d" $fname_static > $fbak_static 
	  cat $fbak_static > $fname_static
      rm -f $fbak_static;;
	"-E")
      while read LINE
	  do
		echo "static_lease $LINE" >> $fbak
	  done < $fname_static ;;
    *) return;;
  esac
  cat $fbak > $fname
  rm -f $fbak
  return
}

#  arg1:  phy address.
link_down()
{
	# get original register value
	get_mii=`mii_mgr -g -p $1 -r 0`
	orig=`echo $get_mii | sed 's/^.....................//'`

	# stupid hex value calculation.
	pre=`echo $orig | sed 's/...$//'`
	post=`echo $orig | sed 's/^..//'` 
	num_hex=`echo $orig | sed 's/^.//' | sed 's/..$//'`
	case $num_hex in
		"0")	rep="8"	;;
		"1")	rep="9"	;;
		"2")	rep="a"	;;
		"3")	rep="b"	;;
		"4")	rep="c"	;;
		"5")	rep="d"	;;
		"6")	rep="e"	;;
		"7")	rep="f"	;;
		# The power is already down
		*)		echo "Port$1 is down. Skip.";return;;
	esac
	new=$pre$rep$post
	# power down
	mii_mgr -s -p $1 -r 0 -v $new 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: mii_mgr -s -p $1 -r 0 -v $new" >> $test_log
	fi
}

link_up()
{
	# get original register value
	get_mii=`mii_mgr -g -p $1 -r 0`
	orig=`echo $get_mii | sed 's/^.....................//'`

	# stupid hex value calculation.
	pre=`echo $orig | sed 's/...$//'`
	post=`echo $orig | sed 's/^..//'` 
	num_hex=`echo $orig | sed 's/^.//' | sed 's/..$//'`
	case $num_hex in
		"8")	rep="0"	;;
		"9")	rep="1"	;;
		"a")	rep="2"	;;
		"b")	rep="3"	;;
		"c")	rep="4"	;;
		"d")	rep="5"	;;
		"e")	rep="6"	;;
		"f")	rep="7"	;;
		# The power is already up
		*)		echo "Port$1 is up. Skip.";return;;
	esac
	new=$pre$rep$post
	# power up
	mii_mgr -s -p $1 -r 0 -v $new 2>>$test_log
	if [ $? -ne 0 ];then
	    echo "Error: mii_mgr -s -p $1 -r 0 -v $new" >> $test_log
	fi
}

reset_all_phys()
{
	sleep_time=$1

	if [ "x$CONFIG_RAETH_ROUTER" != "xy" -a "x$CONFIG_RT_3052_ESW" != "xy" ]; then
		return
	fi

	opmode=`nvram_get 2860 OperationMode`

	#skip WAN port
	if [ "x$opmode" != "x1" ]; then #no wan port
		link_down 0
		link_down 4
	elif [ "x$CONFIG_WAN_AT_P4" = "xy" ]; then #wan port at port4
		link_down 0
	elif [ "x$CONFIG_WAN_AT_P0" = "xy" ]; then #wan port at port0
		link_down 4
	fi
	link_down 1
	link_down 2
	link_down 3

	#force Windows clients to renew IP and update DNS server
	sleep $sleep_time

	#skip WAN port
	if [ "x$opmode" != "x1" ]; then #no wan port
		link_up 0
		link_up 4
	elif  [ "x$CONFIG_WAN_AT_P4" = "xy" ]; then #wan port at port4
		link_up 0
	elif [ "x$CONFIG_WAN_AT_P0" = "xy" ]; then #wan port at port0
		link_up 4
	fi
	link_up 1
	link_up 2
	link_up 3
}

# argv 1 is empty
if [ "$1" = "" ]; then
  usage
fi

# argv 2 is empty
if [ "$2" = "" ]; then
  if [ "$1" != "-r" -a "$1" != "-k" -a "$1" != "-S" ]; then
      usage
  fi
fi


if [ "x$1" == "xlan" ]; then
    fname=$path_conf"/udhcpd.conf"
    fbak=$path_conf"/udhcpd.conf_bak"
    pidfile=$path_conf"/udhcpd.pid"
    leases=$path_conf"/udhcpd.leases"
else
    fname=$path_conf"/udhcpd"$1".conf"
    fbak=$path_conf"/udhcpd"$1".conf_bak"
    pidfile=$path_conf"/udhcpd"$1".pid"
    leases=$path_conf"/udhcpd"$1".leases"
fi
fname_static=$path_conf"/static_macip_file"
fbak_static=$path_conf"/static_macip_file_bak"
touch $fname  
	
case "$2" in
  
  "-r")
    
    if [ -e ${pidfile} ]; then
      kill `cat $pidfile`
    fi
    rm -f $pidfile
    touch $leases
	sed '/^lease_file /d' $fname > $fbak
	cat $fbak > $fname
    echo "lease_file $leases" >> $fname
    linenum=`cat $fname|wc -l`
    if [ $linenum -ne 9 -a "$dhcp_type" == "lan" ]; then
        . $path_sh/user-config-udhcpd.sh
    fi
    udhcpd -f $fname &
	reset_all_phys $3
		;;
  "-h") usage;;
  "-p") config "$2" "$3";;
  "-l") config "$2" "$3";;
  "-s") config "$2" "$3";;
  "-e") config "$2" "$3";;
  "-i") config "$2" "$3";;
  "-d") config "$2" "$3" "$4";;
  "-m") config "$2" "$3";;
  "-g") config "$2" "$3";;
  "-t") config "$2" "$3";;
  "-S") config "$2" "$3" "$4";;
  "-D") config "$2" "$3";;
  "-E") config "$2";;
  "-k")
    if [ -e ${pidfile} ]; then
      kill `cat $pidfile`
    fi
    rm -f $pidfile ;;
  "-x") config "$2" "$3";;
  "-y") config "$2" "$3";;
  *) usage;;
esac


