FROM rust:slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml .
# Pre-compile dependencies with a dummy main so real builds are fast
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm src/main.rs
ENTRYPOINT ["sh", "-c", "cp /code/main.rs src/main.rs && if [ -n \"$INSTALL_DEPS\" ]; then eval \"$INSTALL_DEPS\"; fi && cargo build --release && ./target/release/stac-search"]
