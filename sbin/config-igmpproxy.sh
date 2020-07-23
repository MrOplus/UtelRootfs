#!/bin/sh
#
# usage: see function usage()

path_sh=`nv get path_sh`
. $path_sh/global.sh


usage () {
  echo "usage: config-udhcpd.sh [option]..."
  echo "options:"
  echo "  -h                        	: print this help"
  echo "  -c 							: clean the conf file"
  echo "  -u interface					: set upstream interface for server"
  echo "  -d interface1 [interface2]..	: set downstream interface for client"
  echo "  -s addr						: set gateway of upstream interface"
  echo "  -r 							: run igmpproxy"
  exit
}

config () {
  case "$1" in
    "-c")
      sed -i '36,$d' $fname;;  
    "-u")
      sed -i "30c phyint $2 upstream  ratelimit 0  threshold 1" $fname;;      
    "-d")
      sed -i '$a phyint '"$2"' downstream  ratelimit 0  threshold 1' $fname
	  sed -i '$a' $fname;;	        
    "-s")
      sed -i "31c altnet $2/24" $fname;;      

  esac  

}


fname=$path_conf"/igmpproxy.conf"
	
case "$1" in
  

  "-h") usage;;
  "-c") config "$1";;
  "-u") config "$1" "$2";;
  "-s") config "$1" "$2";;
  "-d") config "$1" "$2" "$3" "$4";;
  "-r") igmpproxy& ;;
  *) usage;;
esac


