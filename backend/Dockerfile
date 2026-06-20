# --- Build stage ---
# slim base: same toolchain, far smaller download than the default rust image.
FROM rust:1.78-slim-bookworm AS builder
WORKDIR /app

# Build dependencies first against stub sources. This layer is cached and only
# rebuilt when Cargo.toml/Cargo.lock change — so editing src/ recompiles just
# this crate, not all ~60 dependencies.
COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir src \
    && echo 'fn main() {}' > src/main.rs \
    && echo '' > src/lib.rs \
    && cargo build --release \
    && rm -rf src

# Build the real application. `touch` updates the source mtimes so cargo
# rebuilds the crate — COPY preserves the (older) context mtimes, which would
# otherwise look stale next to the stub artifacts built above.
COPY backend/src ./src
RUN find src -name '*.rs' -exec touch {} + && cargo build --release

# --- Runtime stage ---
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/eeg-analyzer-backend /usr/local/bin/eeg-analyzer-backend
EXPOSE 8080
CMD ["eeg-analyzer-backend"]
