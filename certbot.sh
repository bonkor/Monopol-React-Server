sudo certbot certonly \
  --webroot \
  -w ./certbot-webroot \
  -d monopoly.centrogas.ru \
  --email bonkor@gmail.com \
  --agree-tos \
  --no-eff-email


# 0 3 * * * /usr/bin/certbot renew --webroot -w /home/kostya/Monopol-React-Server/certbot-webroot && cp /etc/letsencrypt/live/monopoly.centrogas.ru/fullchain.pem /home/kostya/Monopol-React-Server/certs/cert.pem && cp /etc/letsencrypt/live/monopoly.centrogas.ru/privkey.pem /home/kostya/Monopol-React-Server/certs/key.pem && docker compose restart
