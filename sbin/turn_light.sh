#!/bin/sh

#set -x

INIT_PATH="/sys/class/leds"
ergodic()
{
        for file in ` ls $INIT_PATH `
        do
                if [ -d $INIT_PATH"/"$file ]  
                then
                        echo $1 > $INIT_PATH"/"$file"/brightness"
                fi
        done
}
ergodic $1
