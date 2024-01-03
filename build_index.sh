cp -f ./src/index_template.html ./public/index.html

if [ "$STG_ENV" = "sit" ]; then
    endpoint="https://sit.geoplatform.info"
elif [ "$STG_ENV" = "stg" ]; then
    endpoint="https://stg.geoplatform.gov"
elif [ "$STG_ENV" = "prd" ]; then
    endpoint="https://geoplatform.gov"
fi

sed -i.bak "s|#PUBLIC_URL#|${endpoint}|g" ./public/index.html