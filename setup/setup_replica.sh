#!/bin/bash
# Usage: MASTER_PASS="xxx" MASTER_LOG_FILE="mysql-bin.000002" MASTER_LOG_POS=1155 bash setup_replica.sh

MASTER_HOST="10.0.0.10"
MASTER_USER="replicator"
MASTER_PASS="${MASTER_PASS:?MASTER_PASS requis}"
MASTER_LOG_FILE="${MASTER_LOG_FILE:?MASTER_LOG_FILE requis}"
MASTER_LOG_POS="${MASTER_LOG_POS:?MASTER_LOG_POS requis}"
ROOT_PASS="${ROOT_PASS:?ROOT_PASS requis}"
LAN_ROOT_PASS="${LAN_ROOT_PASS:?LAN_ROOT_PASS requis}"

DB="docker compose exec -T db mariadb -u root -p${ROOT_PASS}"

echo "==> Création de la base get5..."
$DB -e "CREATE DATABASE IF NOT EXISTS get5 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "==> Import du dump depuis le master LAN..."
ssh root@${MASTER_HOST} \
  "docker exec get5db mysqldump -u root -p'${LAN_ROOT_PASS}' get5" | \
  $DB get5

echo "==> Configuration de la réplication..."
$DB -e "STOP SLAVE; RESET SLAVE ALL;"

$DB -e "CHANGE MASTER TO MASTER_HOST='${MASTER_HOST}', MASTER_USER='${MASTER_USER}', MASTER_PASSWORD='${MASTER_PASS}', MASTER_LOG_FILE='${MASTER_LOG_FILE}', MASTER_LOG_POS=${MASTER_LOG_POS};"

$DB -e "START SLAVE;"

echo "==> Statut de la réplication :"
$DB -e "SHOW SLAVE STATUS\G"
