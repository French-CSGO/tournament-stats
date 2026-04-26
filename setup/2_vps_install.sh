#!/bin/bash
# ============================================================
# ÉTAPE 2 — VPS : installer MariaDB 10.11 + importer le dump
# À exécuter sur le VPS après avoir copié get5_snapshot.sql.gz
# ============================================================
set -e

DB_NAME="get5"
DUMP_FILE="/tmp/get5_snapshot.sql.gz"

echo "=== [1/3] Installation de MariaDB 10.11 ==="
apt-get install -y lsb-release curl apt-transport-https gnupg2
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup \
    | bash -s -- --mariadb-server-version="10.11"
apt-get install -y mariadb-server
systemctl enable mariadb
systemctl start mariadb

echo "=== [2/3] Écriture de la config replica ==="
cat > /etc/mysql/mariadb.conf.d/99-replication-replica.cnf <<EOF
[mysqld]
server-id          = 2
relay_log          = /var/log/mysql/mysql-relay-bin.log
read_only          = 1
replicate_do_db    = ${DB_NAME}
log_slave_updates  = 1
EOF

systemctl restart mariadb

echo "=== [3/3] Création de la base + import du dump ==="
mariadb -u root -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [ -f "$DUMP_FILE" ]; then
    echo "Import du dump..."
    zcat "$DUMP_FILE" | mariadb -u root "$DB_NAME"
    echo "Import terminé."
else
    echo "❌ Dump introuvable : $DUMP_FILE"
    echo "   Copie le depuis la LAN avec : scp user@10.0.0.10:/tmp/get5_snapshot.sql.gz /tmp/"
    exit 1
fi

echo ""
echo "✅ MariaDB installé et dump importé."
echo "   Lance maintenant le script 3_vps_replica.sh avec les infos du master."
