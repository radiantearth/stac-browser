FROM rocker/r-ver:4
RUN install2.r --error --skipmissing --skipinstalled \
    httr jsonlite
WORKDIR /code
ENTRYPOINT ["Rscript", "search.R"]
