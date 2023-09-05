# echo a string, handling different types
safe_echo() {
    local value="$1"
    if [ -z "$value" ]; then
        echo -n "null"
    elif printf '%s\n' "$value" | grep -qE '\n.+\n$'; then
        echo -n "\`$value\`"
    else
        echo -n "'$value'"
    fi
}

#  handle boolean
bool() {
    case "$1" in
        true | TRUE | yes | t | True)
            echo -n true ;;
        false | FALSE | no | n | False)
            echo -n false ;;
        *)
            echo "Err: Unknown boolean value \"$1\"" >&2
            exit 1 ;;
    esac
}

# handle array values
array() {
    local value="$1"
    local arraytype="$2"
    if [ -z "$value" ]; then
        echo -n "[]"
    else
        case "$arraytype" in
            string)
                echo -n "['$(echo "$value" | sed "s/,/', '/g")']"
                ;;
            *)
                echo -n "[$value]"
                ;;
        esac
    fi
}

# handle object values
object() {
    local value="$1"
    if [ -z "$value" ]; then
        echo -n "null"
    else
        echo -n "$value"
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
        value="$(eval "echo \"\$$name\"")"

        # Get the argument type from the schema
        argtype="$(echo "$config_schema" | jq -r ".properties.$argname.type[0]")"
        arraytype="$(echo "$config_schema" | jq -r ".properties.$argname.items.type[0]")"

        # Encode key/value
        echo -n "  $argname: "
        case "$argtype" in
            string)
                safe_echo "$value"
                ;;
            boolean)
                bool "$value"
                ;;
            integer | number)
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
} > /usr/share/nginx/html/config.js
