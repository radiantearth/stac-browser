FROM rocker/r-ver:latest
RUN apt-get update && apt-get install -y --no-install-recommends \
    libudunits2-0 \
    libproj25 \
    libgdal34 \
    libgeos-c1v5 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /code
ENTRYPOINT ["sh", "-c", "if [ -n \"$INSTALL_DEPS\" ]; then eval \"$INSTALL_DEPS\"; fi && Rscript search.R"]
