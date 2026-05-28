-- Cambiar plugin de auth a mysql_native_password
-- (compatibilidad con driver mariadb-connector-nodejs sin SSL)
ALTER USER 'crm'@'%' IDENTIFIED WITH mysql_native_password BY 'crm_password';

-- Permisos para migraciones Prisma (incluye shadow database)
GRANT ALL PRIVILEGES ON crmseguros.* TO 'crm'@'%';
GRANT CREATE, DROP, ALTER ON *.* TO 'crm'@'%';
FLUSH PRIVILEGES;
