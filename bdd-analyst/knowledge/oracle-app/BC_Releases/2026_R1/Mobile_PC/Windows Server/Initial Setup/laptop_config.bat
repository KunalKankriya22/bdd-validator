
SET ORACLE_HOME=C:\app\oracle\product\18.0.0\dbhomeXE
SET PATH=C:\app\oracle\product\18.0.0\dbhomeXE;%PATH%;
SET ORACLE_SID=xe

sqlplus sys/Password1 as sysdba @C:\bcmpc\replication\Laptop_Config.sql

imp laptop/idemerawlaptop file=C:\bcmpc\replication\laptop.dmp log=C:\bcmpc\replication\log\imp_laptop.log fromuser=laptop 


sqlplus system/Password1 @C:\bcmpc\replication\laptop_public_synonym.sql

