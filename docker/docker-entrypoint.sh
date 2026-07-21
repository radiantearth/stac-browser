# echo a string, handling different types
safe_echo() {
    # $1 = value
    if [ -z "$1" ]; then
        echo -n "null"
    elif printf '%s\n' "$1" | grep -qE '\n.+\n$'; then
        echo -n "\`$1\`"
    else
        echo -n "'$1'"
    fi
}

#  handle boolean
bool() {
    # $1 = value
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
    # $1 = value
    # $2 = arraytype
    if [ -z "$1" ]; then
        echo -n "[]"
    else
        # A full JSON array (e.g. '[{"label":"a","url":"b"}]') is used as-is,
        # which allows arrays of objects.
        case "$(printf '%s' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')" in
            \[*\])
                echo -n "$1"
                ;;
            *)
                case "$2" in
                    string)
                        echo -n "['$(echo "$1" | sed "s/,/', '/g")']"
                        ;;
                    *)
                        echo -n "[$1]"
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
        echo -n "null"
    else
        echo -n "$1"
    fi
}

STAC_PATH_PREFIX=$(printf '%s' "${SB_pathPrefix:-/}" | sed -e 's|^/*|/|' -e 's|/*$|/|')

# Reject characters that could inject nginx directives or break the sed/envsubst substitutions below.
if printf '%s' "$STAC_PATH_PREFIX" | grep -Eq '[&|;{}"'"'"'[:space:]\\]'; then
    echo "Err: SB_pathPrefix contains unsupported characters: ${SB_pathPrefix}" >&2
    exit 1
fi

export SB_pathPrefix="$STAC_PATH_PREFIX"
export STAC_PATH_PREFIX

barePrefix=$(printf '%s' "$STAC_PATH_PREFIX" | sed 's|/*$||')
if [ -n "$barePrefix" ] && [ "$barePrefix" != "/" ]; then
    STAC_PREFIX_REDIRECT="location = ${barePrefix} { return 301 ${STAC_PATH_PREFIX}\$is_args\$args; }"
else
    STAC_PREFIX_REDIRECT=""
fi
export STAC_PREFIX_REDIRECT

envsubst '$STAC_PATH_PREFIX $STAC_PREFIX_REDIRECT' \
    < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Point <base> at the runtime path prefix (Vite builds with base "./").
if [ -f /usr/share/nginx/html/index.html ]; then
    sed -i "s|<base href=\"[^\"]*\" id=\"stac-browser-base\">|<base href=\"${STAC_PATH_PREFIX}\" id=\"stac-browser-base\">|" \
        /usr/share/nginx/html/index.html
fi

config_schema=$(cat /etc/nginx/conf.d/config.schema.json)

# Iterate over environment variables with "SB_" prefix
env -0 | tr '\0' '\n' | cut -f1 -d= | grep "^SB_" | {
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
