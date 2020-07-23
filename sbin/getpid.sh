#/bin/sh

TMPLINE=`ps|grep -s "[[:digit:]]\+:[[:digit:]]\+ \(/.*/\)*$1\>"`

if [ -z "${TMPLINE}" ]; then
		echo "nono"
		exit 127
else
	echo "${TMPLINE}"|awk '{print $1}'
	exit 0
fi

