#!/bin/bash
# ============================================================
# ÉTAPE 3 — VPS : connecter la replica au master LAN
# À exécuter sur le VPS après l'étape 2
#
# Récupère les valeurs MASTER_LOG_FILE et MASTER_LOG_POS
# dans le fichier /tmp/master_status.txt généré à l'étape 1
# ============================================================
set -e

MASTER_HOST="10.0.0.10"
MASTER_PORT="3306"
MASTER_USER="replicator"

# À renseigner depuis la sortie du script 1
MASTER_PASS="${MASTER_PASS:?Définis MASTER_PASS=... avant de lancer ce script}"
MASTER_LOG_FILE="${MASTER_LOG_FILE:?Définis MASTER_LOG_FILE=mysql-bin.000001}"
MASTER_LOG_POS="${MASTER_LOG_POS:?Définis MASTER_LOG_POS=XXX}"

echo "=== Configuration de la réplication ==="
mariadb -u root <<SQL
STOP SLAVE;
CHANGE MASTER TO
    MASTER_HOST='${MASTER_HOST}',
    MASTER_PORT=${MASTER_PORT},
    MASTER_USER='${MASTER_USER}',
    MASTER_PASSWORD='${MASTER_PASS}',
    MASTER_LOG_FILE='${MASTER_LOG_FILE}',
    MASTER_LOG_POS=${MASTER_LOG_POS};
START SLAVE;
SQL

echo "=== Vérification du statut ==="
mariadb -u root -e "SHOW SLAVE STATUS\G" | grep -E \
    "Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master|Last_Error|Master_Log_File|Read_Master_Log_Pos"

echo ""
echo "✅ Replica démarrée."
echo "   Slave_IO_Running et Slave_SQL_Running doivent être à 'Yes'."
echo "   En cas d'erreur, vérifie avec : mariadb -u root -e \"SHOW SLAVE STATUS\\G\""
