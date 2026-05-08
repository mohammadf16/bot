# راهنمای کامل دیپلوی VPS

این راهنما برای Ubuntu 22.04/24.04 نوشته شده و فرض می‌کند دامنه شما به IP سرور وصل شده است. در همه دستورها `example.com` را با دامنه واقعی و `YOUR_REPO_URL` را با آدرس ریپازیتوری جایگزین کنید.

## 1. نصب پیش‌نیازها

```bash
sudo apt update
sudo apt install -y curl git nginx mysql-server ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
node -v
npm -v
```

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 2. گرفتن پروژه

```bash
cd /var/www
sudo git clone YOUR_REPO_URL car
sudo chown -R $USER:$USER /var/www/car
cd /var/www/car
```

## 3. ساخت دیتابیس

```bash
DB_PASS="$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")"
echo "$DB_PASS"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS car_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'car_app'@'localhost' IDENTIFIED BY '$DB_PASS';"
sudo mysql -e "GRANT ALL PRIVILEGES ON car_platform.* TO 'car_app'@'localhost'; FLUSH PRIVILEGES;"
```

رمز چاپ‌شده را برای `MYSQL_PASSWORD` نگه دارید.

## 4. نصب پکیج‌ها

```bash
cd /var/www/car/backend
npm ci

cd /var/www/car/frontend
npm ci
```

## 5. ساخت ادمین بعد از دیپلوی

رمز خام ادمین را داخل کد یا git نگذارید. این دستور hash امن می‌سازد:

```bash
cd /var/www/car/backend
npm run admin:hash-password -- "Your-Very-Strong-Admin-Password-Here"
```

خروجی شبیه این است:

```env
BOOTSTRAP_ADMIN_PASSWORD_HASH=$argon2id$...
```

در فایل `.env` بک‌اند این سه مقدار را بگذارید:

```env
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_USERNAME=superadmin
BOOTSTRAP_ADMIN_PASSWORD_HASH=$argon2id$...
```

بعد از اولین اجرای موفق، همین کاربر ساخته می‌شود. بعد از اینکه ورود را تست کردید، بهتر است این سه خط را از `.env` حذف کنید و سرویس را restart کنید.

## 6. تنظیم env بک‌اند

```bash
cd /var/www/car/backend
nano .env
```

نمونه کامل:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=4000

JWT_ACCESS_SECRET=PASTE_RANDOM_SECRET_1
JWT_REFRESH_SECRET=PASTE_RANDOM_SECRET_2
SEED_ENCRYPTION_KEY=PASTE_RANDOM_SECRET_3_MIN_32_CHARS

CORS_ORIGINS=https://example.com,https://www.example.com
API_HARDENING_ENABLED=true
API_STRICT_HOST_CHECK=true
API_ALLOWED_HOSTS=example.com,www.example.com

MYSQL_ENABLED=true
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=car_app
MYSQL_PASSWORD=PASTE_DB_PASS
MYSQL_DATABASE=car_platform
MYSQL_AUTO_CREATE_DATABASE=false
MYSQL_STRICT=true

PUBLIC_API_BASE_URL=https://example.com/api/v1
UPLOADS_DIR=/var/www/car/backend/uploads

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_USERNAME=superadmin
BOOTSTRAP_ADMIN_PASSWORD_HASH=$argon2id$...
BOOTSTRAP_SEED_DATA=false
```

برای ساخت secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 7. تنظیم env فرانت‌اند

```bash
cd /var/www/car/frontend
nano .env.production
```

```env
NEXT_PUBLIC_API_URL=https://example.com/api/v1
NEXT_PUBLIC_WS_URL=wss://example.com/live
```

## 8. Build

```bash
cd /var/www/car/backend
npm run build

cd /var/www/car/frontend
npm run build
```

## 9. اجرای پروژه با PM2

فایل `ecosystem.config.cjs` داخل پروژه آماده است:

```bash
cd /var/www/car
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

اگر `pm2 startup` یک دستور اضافه چاپ کرد، همان را هم اجرا کنید.

چک وضعیت:

```bash
pm2 status
pm2 logs car-backend --lines 100
pm2 logs car-frontend --lines 100
```

## 10. تنظیم Nginx

```bash
sudo nano /etc/nginx/sites-available/car
```

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    client_max_body_size 20m;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /live {
        proxy_pass http://127.0.0.1:4000/live;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        alias /var/www/car/backend/uploads/;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/car /etc/nginx/sites-enabled/car
sudo nginx -t
sudo systemctl reload nginx
```

## 11. SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
pm2 restart car-backend car-frontend
```

## 12. تست نهایی

```bash
curl https://example.com/api/v1/health
curl https://example.com/robots.txt
curl https://example.com/sitemap.xml
```

سپس در مرورگر:

1. بروید به `https://example.com/login`
2. با `BOOTSTRAP_ADMIN_EMAIL` یا `BOOTSTRAP_ADMIN_USERNAME` و رمز خامی که خودتان انتخاب کردید وارد شوید.
3. مسیر `https://example.com/admin` را باز کنید.
4. از `/admin/settings` یک تغییر تستی ذخیره کنید.
5. از `/admin/blog` یک پست بسازید و publish کنید.
6. از `/admin/seo` یک metadata یا robots را ذخیره کنید.

## 13. نکات مهم CMS

پنل ادمین برای تنظیمات سایت، هدر، فوتر، صفحه اصلی، درباره، قوانین، Legal، بنرها، SEO، بلاگ، کاربران، مالی، خودروها، قرعه‌کشی، پشتیبانی، وام، گردونه و اسلاید وجود دارد. هر متنی که هنوز مستقیم داخل کامپوننت‌های React hard-code شده باشد فقط با تغییر کد عوض می‌شود؛ ولی بخش‌های دیتابیسی و تنظیماتی از پنل قابل مدیریت هستند.

## 14. آپدیت نسخه جدید

```bash
cd /var/www/car
git pull

cd backend
npm ci
npm run build

cd ../frontend
npm ci
npm run build

cd ..
pm2 restart car-backend car-frontend
```

## 15. بکاپ

```bash
mkdir -p ~/car-backups
mysqldump -u car_app -p car_platform > ~/car-backups/car_platform_$(date +%F).sql
tar -czf ~/car-backups/uploads_$(date +%F).tar.gz /var/www/car/backend/uploads
```
