cp -fp ./src/index_template.html ./public/index.html

if [ "$STG_ENV" = "sit" ]; then
    endpoint="https://sit.geoplatform.info"
    support="https://sit-kb.geoplatform.info"
elif [ "$STG_ENV" = "stg" ]; then
    endpoint="https://stg.geoplatform.gov"
    support="https://stg-kb.geoplatform.gov"
elif [ "$STG_ENV" = "prd" ]; then
    endpoint="https://www.geoplatform.gov"
    support="https://kb.geoplatform.gov"
fi

sed -i "s|#PUBLIC_URL#|${endpoint}|g" ./public/index.html
sed -i "s|#SUPPORT_URL#|${support}|g" ./public/index.html

sed -i "s|#PUBLIC_URL#|${endpoint}|g" ./src/theme/page.scss
sed -i "s|#PUBLIC_URL#|${endpoint}|g" ./config.js