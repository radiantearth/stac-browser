#!/bin/bash
set -e
set -u

# Colors
RESET=$(tput sgr0)
RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
YELLOW=$(tput setaf 3)
BLUE=$(tput setaf 6)
BOLD=$(tput bold)

print_help () {
    echo "${BOLD}Deploy STAC Browser${RESET}"
    echo ""
    echo "$0 -s [-m]"
    echo ""
    echo "${BOLD}Options:${RESET}"
    echo "  -s|--staging|-e|--env|--environment VALUE   Sets the staging to VALUE, this is required"
    echo "                                              and must be in ['dev', 'int', 'prod']"
    echo "  -m|--max-age VALUE                          Sets the cache control max-age parameter."
    echo "                                              By default it is 3600 except for dev which is 120."
    exit 0
}

# Parsing command line
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    -h|--help)
      print_help
      ;;
    -s|--staging|-e|--env|--environment)
      STAGING="$2"
      shift # past argument
      shift # past value
      ;;
    -m|--max-age)
      MAX_AGE="$2"
      shift # past argument
      shift # past value
      ;;
    *)    # unknown option
      POSITIONAL+=("$1") # save it in an array for later
      shift # past argument
      ;;
  esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

# Check required options
if [[ -z "${STAGING:-}" ]]; then
    echo >&2 "${RED}ERROR: --staging option not specified"
    exit 1
fi


# Setting catalog URL
CATALOG_URL=https://data.geo.admin.ch/api/stac/v0.9/
if [[ "${STAGING:-}" == "dev" ]] || [[ "${STAGING:-}" == "int" ]]; then
    CATALOG_URL=https://service-stac.${STAGING}.bgdi.ch/api/stac/v0.9/
fi

# Setting default cache control max-age
MAX_AGE=${MAX_AGE:-3600}
if [[ "${STAGING:-}" == "dev" ]]; then
    MAX_AGE=${MAX_AGE:-120}
fi

# Setting s3 URL
if [[ "${STAGING:-}" == "dev" ]]; then
    AWS_PROFILE=swisstopo-bgdi-dev
    S3_BUCKET_NAME=service-stac-browser-dev-swisstopo
elif [[ "${STAGING:-}" == "int" ]]; then
    AWS_PROFILE=swisstopo-bgdi
    S3_BUCKET_NAME=service-stac-browser-int-swisstopo
elif [[ "${STAGING:-}" == "prod" ]]; then
    AWS_PROFILE=swisstopo-bgdi
    S3_BUCKET_NAME=service-stac-browser-prod-swisstopo
else
    echo >&2 "${RED}ERROR: Invalid STAGING=${STAGING:-}${RESET}"
    exit 1
fi


echo "${YELLOW}NPM install...${RESET}"
npm install

echo "${YELLOW}Building with catalog ${CATALOG_URL}...${RESET}"
HISTORY_MODE=hash CATALOG_URL=${CATALOG_URL} npm run build -- --public-url ./

echo "${YELLOW}Uploading to ${S3_BUCKET_NAME}...${RESET}"
aws --profile ${AWS_PROFILE} \
    --region eu-central-1 \
    s3 sync \
        --delete \
        --cache-control "public, max-age=${MAX_AGE}" \
        dist/  s3://${S3_BUCKET_NAME}/browser/

echo "${GREEN}Deployment successful${RESET}"
