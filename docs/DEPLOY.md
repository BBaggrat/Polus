# Deploy

The current release architecture is designed for one Linux VPS with Java 17, Maven, Nginx, Let's Encrypt, and systemd.

## 1. Buy a domain

Buy any domain you control and decide the hostname you want to use, for example `play.example.com`.

## 2. Point DNS

Create an `A` record:

- Host: `play`
- Value: your VPS public IPv4 address

Wait for DNS propagation before requesting a certificate.

## 3. Install packages on the VPS

Ubuntu example:

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk maven nginx certbot python3-certbot-nginx
```

## 4. Create an application user and directories

```bash
sudo useradd --system --home /opt/sandalpunk --shell /usr/sbin/nologin sandalpunk
sudo mkdir -p /opt/sandalpunk
sudo mkdir -p /opt/sandalpunk/data
sudo chown -R sandalpunk:sandalpunk /opt/sandalpunk
```

## 5. Build the jar

On the server or your CI runner:

```bash
mvn clean package
```

The build artifact will be:

- `target/sandalpunk-0.0.1-SNAPSHOT.jar`

## 6. Copy the jar to `/opt/sandalpunk`

```bash
sudo install -m 0644 target/sandalpunk-0.0.1-SNAPSHOT.jar /opt/sandalpunk/sandalpunk.jar
```

## 7. Create the environment file

```bash
sudo tee /opt/sandalpunk/.env >/dev/null <<'EOF'
APP_NAME=sandalpunk
PORT=8080
BASE_URL=https://play.example.com
BOT_TOKEN=replace_me
BOT_USERNAME=replace_me_bot
APP_STORAGE=jdbc
LOG_LEVEL=INFO
DB_DATA_DIR=/opt/sandalpunk/data
DB_URL=
DB_USERNAME=sa
DB_PASSWORD=
EOF
sudo chown sandalpunk:sandalpunk /opt/sandalpunk/.env
sudo chmod 600 /opt/sandalpunk/.env
```

## 8. Install the systemd unit

```bash
sudo cp deploy/systemd/sandalpunk.service /etc/systemd/system/sandalpunk.service
sudo systemctl daemon-reload
sudo systemctl enable sandalpunk
sudo systemctl start sandalpunk
```

## 9. Install the Nginx config

Copy [`deploy/nginx/sandalpunk.conf`](../deploy/nginx/sandalpunk.conf) to `/etc/nginx/sites-available/sandalpunk.conf`, replace `example.com` with your real domain, and enable it:

```bash
sudo ln -s /etc/nginx/sites-available/sandalpunk.conf /etc/nginx/sites-enabled/sandalpunk.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Get a Let's Encrypt certificate

```bash
sudo certbot --nginx -d play.example.com
```

If certbot rewrites the Nginx file, keep the reverse-proxy location that forwards to `127.0.0.1:8080`.

## 11. Restart services

```bash
sudo systemctl restart sandalpunk
sudo systemctl reload nginx
```

## 12. Inspect logs

```bash
sudo journalctl -u sandalpunk -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 13. Persistent player data

Player profiles and friends are stored in a separate file database under `/opt/sandalpunk/data`.
That directory is not replaced during jar deploys, so account progress survives application updates.

If you want to verify it after deploy:

```bash
ls -la /opt/sandalpunk/data
```

## 14. Telegram bot setup

- Create the bot with BotFather.
- Set the Mini App button flow by using `/start` in chat with the bot.
- Make sure `BASE_URL` is HTTPS and reachable from Telegram clients.
