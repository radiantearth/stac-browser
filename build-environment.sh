cp -fp ./src/index_template.html ./public/index.html

if [ "$STG_ENV" = "sit" ]; then
    endpoint="https://sit.geoplatform.info"
    support="https://sit-kb.geoplatform.info/"
elif [ "$STG_ENV" = "stg" ]; then
    endpoint="https://stg.geoplatform.gov"
    support="https://stg-kb.geoplatform.gov"
elif [ "$STG_ENV" = "prd" ]; then
    endpoint="https://www.geoplatform.gov"
    support="https://kb.geoplatform.gov"
fi

<<<<<<< HEAD:build-environment.sh
sed -i.bak "s|#PUBLIC_URL#|${endpoint}|g" ./public/index.html

cp -f ./config_template.js ./config.js
sed -i.bak "s|#STG_ENV#|$STG_ENV|g" ./config.js
=======
sed -i '' "s|#PUBLIC_URL#|${endpoint}|g" ./public/index.html
sed -i '' "s|#SUPPORT_URL#|${support}|g" ./public/index.html
>>>>>>> origin/GS-3364-stac-browser-links:build_index.sh
