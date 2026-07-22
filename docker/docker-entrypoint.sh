#!/bin/sh
# echo a string, handling different types
safe_echo() {
    # $1 = value
    if [ -z "$1" ]; then
        printf 'null'
    else
        encoded_value="$(jq -cn --arg value "$1" '$value')"
        printf '%s' "$encoded_value"
    fi
}

#  handle boolean
bool() {
    # $1 = value
    case "$1" in
        true | TRUE | yes | t | True)
            printf 'true' ;;
        false | FALSE | no | n | False)
            printf 'false' ;;
        *)
            printf 'Err: Unknown boolean value "%s"\n' "$1" >&2
            exit 1 ;;
    esac
}

# handle array values
array() {
    # $1 = value
    # $2 = arraytype
    if [ -z "$1" ]; then
        printf '[]'
    else
        # A full JSON array (e.g. '[{"label":"a","url":"b"}]') is used as-is,
        # which allows arrays of objects.
        case "$(printf '%s' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')" in
            \[*\])
                printf '%s' "$1"
                ;;
            *)
                case "$2" in
                    string)
                        encoded_value="$(jq -cn --arg value "$1" '$value | split(",")')"
                        printf '%s' "$encoded_value"
                        ;;
                    *)
                        printf '[%s]' "$1"
                        ;;
                esac
                ;;
        esac
    fi
}

# handle object values
object() {
    # $1 = value
    if [ -z "$1" ]; then
        printf 'null'
    else
        printf '%s' "$1"
    fi
}

config_schema=$(cat /etc/nginx/conf.d/config.schema.json)

# Iterate over environment variables with "SB_" prefix
env -0 | cut -f1 -d= | tr '\0' '\n' | grep "^SB_" | {
    echo "window.STAC_BROWSER_CONFIG = {"
    while IFS='=' read -r name; do
        # Strip the prefix
        argname="${name#SB_}"
        # Read the variable's value
        value="$(printenv "$name")"

        # Get the argument type from the schema
        argtype="$(printf '%s\n' "$config_schema" | jq -r ".properties.$argname.type[0]")"
        arraytype="$(printf '%s\n' "$config_schema" | jq -r ".properties.$argname.items.type[0]")"

        # Encode key/value
        printf '  %s: ' "$argname"
        case "$argtype" in
            string)
                safe_echo "$value"
                ;;
            boolean)
                bool "$value"
                ;;
            integer | number | object)
                object "$value"
                ;;
            array)
                array "$value" "$arraytype"
                ;;
            *)
                safe_echo "$value"
                ;;
        esac
        echo ","
    done
    echo "}"
} > /usr/share/nginx/html/runtime-config.js
