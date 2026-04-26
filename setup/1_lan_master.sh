#!/bin/bash
# ============================================================
# ÉTAPE 1 — LAN : configurer MariaDB (container Docker) comme master
# À exécuter sur la machine LAN (10.0.0.10)
# ============================================================
set -e

# ── À adapter ──────────────────────────────────────────────
CONTAINER_NAME="${CONTAINER_NAME:-get5db}"   # nom du container docker
DB_NAME="get5"
ROOT_PASS="${ROOT_PASS:?Définis ROOT_PASS=<ton_mot_de_passe_root> avant de lancer ce script}"
REPL_USER="replicator"
REPL_PASS="${REPL_PASS:-$(openssl rand -base64 24)}"
DUMP_FILE="/tmp/get5_snapshot.sql.gz"
# ───────────────────────────────────────────────────────────

DK="docker exec -i $CONTAINER_NAME"
MDB="mariadb -u root -p${ROOT_PASS}"

echo "=== Vérification du container ==="
docker inspect "$CONTAINER_NAME" --format '{{.State.Status}}' | grep -q running \
    || { echo "❌ Container '$CONTAINER_NAME' introuvable ou arrêté."; exit 1; }

echo "=== [1/3] Écriture de la config master dans le container ==="
docker exec "$CONTAINER_NAME" bash -c "cat > /etc/mysql/mariadb.conf.d/99-replication-master.cnf <<'EOF'
[mysqld]
server-id         = 1
log_bin           = /var/log/mysql/mysql-bin.log
binlog_format     = ROW
binlog_do_db      = ${DB_NAME}
expire_logs_days  = 7
max_binlog_size   = 100M
EOF"

echo "Redémarrage du container pour appliquer la config binlog..."
docker restart "$CONTAINER_NAME"
echo "Attente que MariaDB soit prêt..."
until docker exec "$CONTAINER_NAME" mariadb -u root -p${ROOT_PASS} -e "SELECT 1" &>/dev/null; do
    sleep 2
done

echo "=== [2/3] Création de l'utilisateur de réplication ==="
$DK $MDB <<SQL
CREATE USER IF NOT EXISTS '${REPL_USER}'@'10.0.0.%' IDENTIFIED BY '${REPL_PASS}';
GRANT REPLICATION SLAVE ON *.* TO '${REPL_USER}'@'10.0.0.%';
FLUSH PRIVILEGES;
SQL

echo "=== [3/3] Dump de la base + position binlog ==="
$DK $MDB -e "SHOW MASTER STATUS\G" | tee /tmp/master_status.txt

echo "Dump en cours..."
docker exec "$CONTAINER_NAME" mysqldump -u root -p${ROOT_PASS} \
    --single-transaction --master-data=2 \
    --routines --triggers --events \
    "$DB_NAME" | gzip > "$DUMP_FILE"

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
echo "Position binlog :"
cat /tmp/master_status.txt
