FROM denoland/deno:alpine

WORKDIR /app
COPY . .

CMD ./httpd.js -p 5000 --cors www

