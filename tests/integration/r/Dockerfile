FROM rocker/r-ver:latest
RUN apt-get update && apt-get install -y --no-install-recommends \
    libudunits2-0 \
    libproj25 \
    libgdal34 \
    libgeos-c1v5 \
    && rm -rf /var/lib/apt/lists/*
RUN install2.r --error --skipmissing --skipinstalled \
    rstac
WORKDIR /code
ENTRYPOINT ["Rscript", "search.R"]
