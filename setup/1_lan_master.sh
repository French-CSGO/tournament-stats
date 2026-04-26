#!/bin/bash
# ============================================================
# ÉTAPE 1 — LAN : configurer MariaDB comme master
# À exécuter sur la machine LAN (10.0.0.10)
# ============================================================
set -e

MARIADB_CNF="/etc/mysql/mariadb.conf.d/99-replication-master.cnf"
DB_NAME="get5"
REPL_USER="replicator"
REPL_PASS="${REPL_PASS:-$(openssl rand -base64 24)}"
DUMP_FILE="/tmp/get5_snapshot.sql.gz"

echo "=== [1/3] Écriture de la config master ==="
cat > "$MARIADB_CNF" <<EOF
[mysqld]
server-id         = 1
log_bin           = /var/log/mysql/mysql-bin.log
binlog_format     = ROW
binlog_do_db      = ${DB_NAME}
expire_logs_days  = 7
max_binlog_size   = 100M
EOF

echo "Redémarrage de MariaDB..."
systemctl restart mariadb

echo "=== [2/3] Création de l'utilisateur de réplication ==="
mariadb -u root <<SQL
CREATE USER IF NOT EXISTS '${REPL_USER}'@'10.0.0.%' IDENTIFIED BY '${REPL_PASS}';
GRANT REPLICATION SLAVE ON *.* TO '${REPL_USER}'@'10.0.0.%';
FLUSH PRIVILEGES;
SQL

echo "=== [3/3] Dump de la base + position binlog ==="
mariadb -u root -e "FLUSH TABLES WITH READ LOCK; SHOW MASTER STATUS\G" 2>&1 | tee /tmp/master_status.txt &
LOCK_PID=$!

sleep 1
mysqldump -u root --single-transaction --master-data=2 \
    --routines --triggers --events \
    "$DB_NAME" | gzip > "$DUMP_FILE"

kill $LOCK_PID 2>/dev/null || true
mariadb -u root -e "UNLOCK TABLES;"

echo ""
echo "✅ Master configuré."
echo ""
echo "Copie le dump vers le VPS :"
echo "  scp $DUMP_FILE user@<VPS_IP>:/tmp/"
echo ""
echo "Identifiants de réplication (à noter pour l'étape 3) :"
echo "  User     : $REPL_USER"
echo "  Password : $REPL_PASS"
echo ""
cat /tmp/master_status.txt
