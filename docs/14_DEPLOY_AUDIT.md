# Аудит деплоя

## Текущая схема

```text
Git repository
  → mvn clean package
  → /opt/sandalpunk/sandalpunk.jar
  → systemd: sandalpunk.service
  → localhost:8080
  → Nginx :443
  → Telegram / Browser
```

Backend и бот запускаются одним процессом.

## Файлы

| Файл | Назначение |
| --- | --- |
| `deploy/systemd/sandalpunk.service` | запуск JAR и restart policy |
| `deploy/nginx/sandalpunk.conf` | HTTP→HTTPS и reverse proxy |
| `deploy/scripts/deploy.sh` | Maven build, backup JAR, install, restart |
| `deploy/scripts/rollback.sh` | возврат `sandalpunk.jar.previous` |
| `deploy/scripts/restart.sh` | ручной restart |
| `deploy/scripts/logs.sh` | follow journalctl |
| `/opt/sandalpunk/.env` | production secrets/config, вне git |

## Требуемые переменные

Основные:

- `APP_NAME`;
- `SERVICE_NAME`;
- `APP_VERSION`;
- `PORT`;
- `SPRING_PROFILES_ACTIVE`;
- `BASE_URL`;
- `BOT_TOKEN`;
- `BOT_USERNAME`;
- `APP_STORAGE`;
- `ALLOW_DEV_SESSIONS`;
- `LOG_LEVEL`.

Хранение:

- `DB_DATA_DIR`;
- `DB_URL`;
- `DB_USERNAME`;
- `DB_PASSWORD`.

Баланс:

- `DUEL_BALANCE_VERSION`;
- `DUEL_*` из `.env.example`.

## Установка

Ubuntu:

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk maven nginx certbot python3-certbot-nginx
java -version
mvn -version
```

Сборка:

```bash
mvn clean package
```

Деплой:

```bash
bash deploy/scripts/deploy.sh
```

На текущем production ранее использовалась команда:

```bash
ssh root@134.122.92.236 "/usr/local/bin/polus-deploy"
```

Содержимое `/usr/local/bin/polus-deploy` нужно сравнить с репозиторным скриптом. Репозиторий не является источником истины, пока это не проверено.

## Systemd

Положительные свойства:

- отдельный системный пользователь `sandalpunk`;
- `EnvironmentFile`;
- автоматический restart;
- рабочий каталог `/opt/sandalpunk`;
- логи в journal.

Проверить на VPS:

```bash
sudo systemctl cat sandalpunk
sudo systemctl status sandalpunk --no-pager
sudo journalctl -u sandalpunk -n 200 --no-pager
```

Риски:

- unit не содержит readiness probe;
- нет startup timeout;
- нет явных memory limits;
- backend и бот перезапускаются вместе;
- права `/opt/sandalpunk/.env` нужно проверить вручную.

## Nginx и SSL

Конфиг:

- порт 80 оставлен для ACME и redirect;
- порт 443 проксирует на `127.0.0.1:8080`;
- передает `X-Forwarded-*`;
- использует TLS 1.2/1.3.

Проверить:

```bash
sudo nginx -t
sudo certbot certificates
curl -I http://<domain>/duel
curl -I https://<domain>/duel
curl -fsS https://<domain>/api/health
```

Риски:

- sample содержит `example.com` и требует ручной замены;
- нет rate limiting;
- нет security headers;
- нет отдельной защиты `/api/zrp/events`;
- состояние сертификата не контролируется приложением.

## Данные и backup

При файловой H2:

```text
/opt/sandalpunk/data
```

JAR backup не является backup данных. Перед деплоем со схемой БД нужен отдельный снимок каталога при остановленном приложении или безопасная процедура backup.

Пример проверки:

```bash
sudo ls -lah /opt/sandalpunk/data
sudo du -sh /opt/sandalpunk/data
```

**TODO перед миграциями:** утвердить автоматический backup и восстановление H2/PostgreSQL.

## Откат

`deploy.sh` сохраняет предыдущий JAR:

```text
/opt/sandalpunk/sandalpunk.jar.previous
```

Откат:

```bash
bash deploy/scripts/rollback.sh
curl -fsS http://127.0.0.1:8080/api/health
```

Ограничение: откат JAR не откатывает несовместимую миграцию данных.

## Обязательные проверки на VPS

- [ ] Java 17.
- [ ] Maven доступен либо сборка выполняется вне VPS.
- [ ] `.env` имеет права `600`.
- [ ] service работает от `sandalpunk`.
- [ ] `BASE_URL=https://полус.tech` или актуальный домен.
- [ ] реальные секреты отсутствуют в git.
- [ ] `ALLOW_DEV_SESSIONS` соответствует решению по browser demo.
- [ ] health доступен локально и через Nginx.
- [ ] `/duel` открывается.
- [ ] `/start` отправляет правильную кнопку.
- [ ] backup данных существует.
- [ ] rollback проверен.
- [ ] journal не заполняет диск.

## Решения перед публичным 1.0

1. Защитить debug endpoints.
2. Ввести миграции БД.
3. Автоматизировать backup.
4. Добавить CI build.
5. Зафиксировать production profile.
6. Решить, оставлять ли browser demo публичным.
7. Добавить security headers и базовый rate limiting.
