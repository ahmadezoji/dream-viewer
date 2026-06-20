FROM ghcr.io/cirruslabs/flutter:stable AS build
WORKDIR /app
COPY frontend/pubspec.* ./
RUN flutter pub get
COPY frontend/ .
RUN flutter build web --dart-define=API_BASE_URL=http://localhost:8080
FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 80
