FROM r-base:latest
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev libssl-dev libxml2-dev \
  && rm -rf /var/lib/apt/lists/*
RUN R -e "install.packages(c('httr', 'jsonlite'), repos='https://cloud.r-project.org', quiet=TRUE)"
WORKDIR /code
ENTRYPOINT ["Rscript", "search.R"]
