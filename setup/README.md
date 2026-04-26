# Réplication MariaDB LAN → VPS

## Prérequis
- WireGuard actif entre LAN (10.0.0.10) et VPS
- MariaDB 10.11 sur la LAN, aucune install requise sur le VPS (script 2 s'en charge)

## Ordre d'exécution

### Sur la LAN (10.0.0.10)
```bash
chmod +x 1_lan_master.sh
sudo bash 1_lan_master.sh
```
Copie le mot de passe replicator et les valeurs `File` / `Position` affichés à la fin.  
Copie ensuite le dump vers le VPS :
```bash
scp /tmp/get5_snapshot.sql.gz user@<VPS_IP>:/tmp/
```

### Sur le VPS
```bash
chmod +x 2_vps_install.sh
sudo bash 2_vps_install.sh
```

Puis lance l'étape 3 avec les valeurs récupérées à l'étape 1 :
```bash
chmod +x 3_vps_replica.sh
sudo MASTER_PASS="xxx" MASTER_LOG_FILE="mysql-bin.000001" MASTER_LOG_POS=154 bash 3_vps_replica.sh
```

## Vérifier la réplication
```bash
# Sur le VPS
mariadb -u root -e "SHOW SLAVE STATUS\G"
```
Les deux lignes suivantes doivent être à `Yes` :
```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
```

## Firewall
Sur la LAN, autorise le port 3306 depuis l'IP WireGuard du VPS :
```bash
ufw allow from <VPS_WG_IP> to any port 3306
```
