FROM denoland/deno:alpine

WORKDIR /app
COPY . .

USER deno
CMD ./httpd.js -p 5000 --cors www
