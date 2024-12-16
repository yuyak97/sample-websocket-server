## Create crt and key

```sh
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout ./server.key -out ./server.crt -subj "/C=JP/ST=TestState/O=TestOrganization" -addext "subjectAltName=IP:127.0.0.1"
```

## Start server

```sh
node server.js
```
