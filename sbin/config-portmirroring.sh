#!/bin/sh

cmd="insmod /lib/modules/3.4.110/kernel/net/core/ziyan/portmirroring/portmirroring.ko do_it=1"

usage()
{
	echo "Usage: config-protmirroring.sh [option]"
	echo "options:"
	echo "  -h                  : print this help"
	echo "  -a dev_name_from    "
	echo "  -b dev_name_to      "
	echo "  -c mac_src          "
	echo "  -d mac_dst          "
	echo "  -e ether_proto      "
	echo "  -f ip_proto         "
	echo "  -g ip_src           "
	echo "  -i ip_dst           "
	echo "  -j is_frag          "
	echo "  -k port_src         "
	echo "  -l port_dst         "
	echo "  -m tcp_seq          "
	echo "  -n tcp_ack          "
	echo "  -o tcp_flags        : example:SYN/RST/FIN"
	echo "  -p tcp_window       "
	echo "  -q checksum         "
	
	exit 1
}

while getopts a:b:c:d:e:f:g:i:j:k:l:m:n:o:p:q:h option
do 
    case "$option" in
        a)
			cmd=$cmd" dev_name_from=$OPTARG"
            #echo "option:f, value $OPTARG"
            #echo "next arg index:$OPTIND"
			;;
        b)
			cmd=$cmd" dev_name_to=$OPTARG"
            #echo "option:t"
            #echo "next arg index:$OPTIND"
			;;
		c)
			cmd=$cmd" mac_src=$OPTARG"
			;;
		d)
			cmd=$cmd" mac_dst=$OPTARG"
			;;
		e)
			cmd=$cmd" ether_proto=$OPTARG"
			;;
		f)
			cmd=$cmd" ip_proto=$OPTARG"
			;;
		g)
			cmd=$cmd" ip_src=$OPTARG"
			;;
		h)
			usage
			;;
		i)
			cmd=$cmd" ip_dst=$OPTARG"
			;;
		j)
			cmd=$cmd" is_frag=$OPTARG"
			;;
		k)
			cmd=$cmd" port_src=$OPTARG"
			;;
		l)
			cmd=$cmd" port_dst=$OPTARG"
			;;
		m)
			cmd=$cmd" tcp_seq=$OPTARG"
			;;
		n)
			cmd=$cmd" tcp_ack=$OPTARG"
			;;
		o)
			cmd=$cmd" tcp_flags=$OPTARG"
			;;
		p)
			cmd=$cmd" tcp_window=$OPTARG"
			;;
		q)
			cmd=$cmd" checksum=$OPTARG"
			;;
        \?)
            usage
            ;;
    esac
done

echo $cmd
rmmod portmirroring
eval $cmd
