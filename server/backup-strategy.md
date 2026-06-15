MariaDB automated backups.
Create this file on your VM at ~/PBL_206/backup.sh:
```
#!/bin/bash
BACKUP_DIR="/home/berkah/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/db_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

docker compose -f /home/berkah/PBL_206/docker-compose.yml exec -T db \
  mysqldump -u root -p${MYSQL_ROOT_PASSWORD} db_praktikum | gzip > $FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup done: $FILE"
```
Make it executable and schedule it:
```
chmod +x ~/PBL_206/backup.sh
```
Crontab (runs at 10am if machine is on):
```
crontab -e
```
Add:
```
0 10 * * * /home/berkah/PBL_206/backup.sh >> /home/berkah/backups/backup.log 2>&1
```
Anacron (catches missed runs on boot):
```
sudo apt install anacron
sudo nano /etc/anacrontab
```
Add at the bottom:
```
1   10   backup-db   /home/berkah/PBL_206/backup.sh >> /home/berkah/backups/backup.log 2>&1
```
The 10 in anacrontab means 10 minutes after boot — so if yesterday's 10am backup was missed, it runs 10 minutes after you turn the laptop on.
Test it:
```
MYSQL_ROOT_PASSWORD=yourpassword ~/PBL_206/backup.sh
cat ~/backups/backup.log
```
Done?
