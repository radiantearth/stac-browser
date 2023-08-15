#!/bin/sh
# vim:sw=4:ts=4:et

str_or_null() {
    if [ -z "$1" ]
    then
        echo -n "null"
    elif echo "$1" | grep -qzoP '\n.+\n$'
    then
        echo -n "\`$1\`"
    else
        echo -n "'$1'"
    fi
}

str_list() {
    if [ -z "$1" ]
    then
        echo -n "[]"
    else
        echo -n "['$(echo $1 | sed "s/,/', '/g")']"
    fi
}

object_list_or_null() {
    if [ -z "$1" ]
    then
        echo -n "null"
    else
        echo -n "[$(echo $1 | sed "s/,/, /g")]"
    fi
}


bool() {
    case "$1" in
        true | TRUE | yes | t | True)
            echo -n true ;;
        false| FALSE | no | n | False)
            echo -n false ;;
        *)
            echo "Err: Unknown boolean value \"$1\"" 1>&1; exit 1 ;;
    esac
}

object_or_null() {
    if [ -z "$1" ]
    then
        echo -n "null"
    else
        echo -n "$1"
    fi
}

config_schema=$(cat config.schema.json)

# get all env var names prefixed with "SB_"
env -0 | cut -z -f1 -d= | tr '\0' '\n' | grep "^SB_"| {
    echo "window.STAC_BROWSER_CONFIG = {"
    while IFS='=' read -r name  ; do
        # strip the prefix
        argname=$(echo "${name#SB_}")
        # read te vars value
        value=$(eval "echo \"\$$name\"")

        # get the argument type from the schema
        argtype=$(echo $config_schema | jq -r ".properties.$argname.type[0]")

        # encode key/value
        echo -n "  $argname: "
        case "$argtype" in
            string)
                str_or_null "$value"
                ;;
            boolean)
                bool "$value"
                ;;
            integer | number)
                object_or_null "$value"
                ;;
            array)
                arraytype=$(echo $config_schema | jq -r ".properties.$argname.items.type[0]")
                case "$arraytype" in
                    string)
                        str_list "$value"
                        ;;
                    *)
                        object_list_or_null "$value"
                        ;;
                esac
                ;;
            *)
                str_or_null "$value"
                ;;
        esac
        echo ","
    done
    echo "}"
} > /usr/share/nginx/html/config.js
