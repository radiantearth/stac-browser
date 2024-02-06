cp -f ./src/index_template.html ./public/index.html

if [ "$STG_ENV" = "sit" ]; then
    endpoint="https://sit.geoplatform.info"
elif [ "$STG_ENV" = "stg" ]; then
    endpoint="https://stg.geoplatform.gov"
elif [ "$STG_ENV" = "prd" ]; then
    endpoint="https://www.geoplatform.gov"
fi

sed -i.bak "s|#PUBLIC_URL#|${endpoint}|g" ./public/index.html

cp -f ./config_template.js ./config.js
sed -i.bak "s|#STG_ENV#|$STG_ENV|g" ./config.js