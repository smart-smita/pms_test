mysql -u root -e "DROP DATABASE IF EXISTS gaptm_copy; CREATE DATABASE gaptm_copy;"
mysqldump -u root gaptm > gaptm.sql
mysql -u root gaptm_copy < gaptm.sql
