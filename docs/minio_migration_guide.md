# MinIO Migration Guide

## 🎯 Overview

Этот гайд поможет перейти с локального файлового хранилища на **MinIO** (S3-совместимое хранилище) для production-ready решения.

## 📋 Зачем нужен MinIO?

- ✅ **Масштабируемость**: работает с несколькими инстансами backend
- ✅ **Presigned URLs**: прямое скачивание файлов без нагрузки на backend
- ✅ **Backup/Restore**: простое резервное копирование
- ✅ **Production-ready**: используется во всех major MLOps платформах

---

## 🚀 Новая установка (с нуля)

### 1. Настройте .env

```bash
# Storage backend selection
STORAGE_BACKEND=minio  # "local" или "minio"

# MinIO Configuration
MINIO__ENDPOINT=minio:9000
MINIO__ACCESS_KEY=minioadmin
MINIO__SECRET_KEY=minioadmin
MINIO__BUCKET=mlops-files
MINIO__REGION=us-east-1
MINIO__SECURE=false
MINIO__PUBLIC_ENDPOINT=http://localhost:9000
MINIO__RETRY_ATTEMPTS=3
MINIO__RETRY_BACKOFF=0.5
MINIO__PRESIGN_EXPIRY=3600
```

### 2. Запустите MinIO

```powershell
# Production
docker compose up -d minio backend

# Development
docker compose -f docker-compose.dev.yaml up -d minio backend
```

### 3. Проверьте MinIO Console

Откройте http://localhost:9001

- **Login**: minioadmin
- **Password**: minioadmin

Bucket `mlops-files` будет создан автоматически при первом запуске backend.

---

## 🔄 Миграция с Local Storage на MinIO

### Шаг 1: Backup существующих файлов

```powershell
# Создайте backup локальных файлов
cd c:\App\ReactProject\domains\MLOps
tar -czf files_backup_$(Get-Date -Format 'yyyy-MM-dd').tar.gz backend\storage\

# Или просто скопируйте папку
Copy-Item -Path ".\infra\storage" -Destination ".\infra\storage_backup_$(Get-Date -Format 'yyyy-MM-dd')" -Recurse
```

### Шаг 2: Запустите MinIO

```powershell
docker compose up -d minio
```

Проверьте, что MinIO запустился:
```powershell
docker logs minio
```

### Шаг 3: Установите MinIO Client (mc)

**Windows (PowerShell):**
```powershell
# Скачать mc.exe
Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile "mc.exe"

# Или через Chocolatey
choco install minio-client
```

**Linux/MacOS:**
```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

### Шаг 4: Настройте alias для MinIO

```powershell
# Добавьте alias для локального MinIO
.\mc.exe alias set local http://localhost:9000 minioadmin minioadmin

# Проверьте подключение
.\mc.exe admin info local
```

### Шаг 5: Создайте bucket (если не создался автоматически)

```powershell
.\mc.exe mb local/mlops-files
```

### Шаг 6: Миграция файлов

```powershell
# Скопируйте все файлы из local storage в MinIO
.\mc.exe cp --recursive .\infra\storage\ local/mlops-files/

# Проверьте, что файлы загружены
.\mc.exe ls local/mlops-files/
```

### Шаг 7: Обновите .env

```bash
# Измените storage backend на MinIO
STORAGE_BACKEND=minio
```

### Шаг 8: Перезапустите backend

```powershell
docker compose restart backend

# Или для dev окружения
docker compose -f docker-compose.dev.yaml restart backend
```

### Шаг 9: Проверка

1. **Откройте MinIO Console**: http://localhost:9001
2. **Проверьте bucket** `mlops-files`
3. **Зайдите в приложение** и попробуйте:
   - Загрузить новый датасет
   - Скачать существующий датасет (должен использовать presigned URL)

**Проверьте логи backend:**
```powershell
docker logs backend

# Должны увидеть:
# INFO:service.container:Initialized MinIO storage backend
```

---

## ✅ Проверочный чеклист

- [ ] MinIO запущен (`docker ps | grep minio`)
- [ ] MinIO Console доступна (http://localhost:9001)
- [ ] Bucket `mlops-files` создан
- [ ] Файлы мигрированы (если были)
- [ ] `.env` обновлён (`STORAGE_BACKEND=minio`)
- [ ] Backend перезапущен
- [ ] Логи backend показывают "Initialized MinIO storage backend"
- [ ] Загрузка датасета работает
- [ ] Скачивание датасета работает (presigned URL)

---

## 🔧 Troubleshooting

### MinIO не запускается

```powershell
# Проверьте логи
docker logs minio

# Проверьте порты
netstat -an | Select-String "9000|9001"

# Перезапустите
docker compose down
docker compose up -d minio
```

### Backend не может подключиться к MinIO

**Проблема**: `Connection refused` в логах backend

**Решение**:
1. Проверьте, что MinIO запущен: `docker ps | grep minio`
2. Проверьте переменные окружения в docker-compose.yaml:
   ```yaml
   - MINIO__ENDPOINT=minio:9000  # НЕ localhost!
   ```
3. Убедитесь, что backend и MinIO в одной Docker сети

### Presigned URLs не работают

**Проблема**: Ссылки ведут на `http://minio:9000` (недоступный снаружи)

**Решение**:
Обновите `MINIO__PUBLIC_ENDPOINT` в .env:
```bash
# Для локальной разработки
MINIO__PUBLIC_ENDPOINT=http://localhost:9000

# Для production (замените на ваш домен)
MINIO__PUBLIC_ENDPOINT=https://minio.yourdomain.com
```

### Файлы не загружаются

**Проблема**: `Bucket not found` в логах

**Решение**:
```powershell
# Создайте bucket вручную
.\mc.exe mb local/mlops-files

# Или через консоль MinIO (http://localhost:9001)
```

---

## 🔄 Откат на Local Storage

Если нужно вернуться на локальное хранилище:

### 1. Измените .env
```bash
STORAGE_BACKEND=local
```

### 2. Перезапустите backend
```powershell
docker compose restart backend
```

### 3. (Опционально) Скопируйте файлы из MinIO

```powershell
# Скачайте все файлы из MinIO обратно
.\mc.exe cp --recursive local/mlops-files/ .\infra\storage\
```

---

## 📚 Дополнительные ресурсы

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO Client (mc) Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

---

## 🎉 Готово!

После успешной миграции:
- ✅ Файлы хранятся в MinIO
- ✅ Presigned URLs работают
- ✅ Backend может масштабироваться горизонтально
- ✅ Готово к production deployment

**Следующие шаги**:
1. Настройте backup для MinIO bucket
2. Добавьте monitoring (Prometheus + Grafana)
3. Настройте lifecycle policies для старых файлов
4. (Опционально) Настройте CDN перед MinIO
