# Release deploy checklist

## Environment

- Java 17 установлен.
- Maven доступен для сборки.
- `SPRING_PROFILES_ACTIVE=prod`.
- `PORT` задан.
- `BASE_URL=https://YOUR_DOMAIN`.
- `BOT_TOKEN` задан через env.
- `BOT_USERNAME` задан через env.
- `ALLOW_DEV_SESSIONS=false` для публичного production.
- Реальных секретов в репозитории нет.

## Build

```bash
mvn clean package
```

## Systemd

```bash
sudo systemctl status polus
sudo journalctl -u polus -f
sudo systemctl restart polus
```

Проверить restart policy, рабочую директорию, env-file и путь к JAR.

## Nginx / HTTPS

```bash
sudo nginx -t
sudo systemctl reload nginx
curl https://YOUR_DOMAIN/api/health
curl https://YOUR_DOMAIN/actuator/health
```

Проверить:

- HTTP -> HTTPS redirect.
- Let's Encrypt сертификат.
- Proxy на backend port.
- Отсутствие localhost в production URL.
- Nginx access/error logs.

## Healthcheck

```bash
curl https://YOUR_DOMAIN/api/health
curl https://YOUR_DOMAIN/actuator/health
```

Ожидается `status=ok`, `version=1.0-rc1`.
