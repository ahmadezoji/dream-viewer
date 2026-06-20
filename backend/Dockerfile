FROM rust:1.78 as builder
WORKDIR /app
COPY backend/Cargo.toml ./
COPY backend/src ./src
RUN cargo build --release
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/eeg-analyzer-backend /usr/local/bin/eeg-analyzer-backend
EXPOSE 8080
CMD ["eeg-analyzer-backend"]
