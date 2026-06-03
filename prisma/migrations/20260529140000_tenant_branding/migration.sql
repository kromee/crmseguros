ALTER TABLE `tenants`
  ADD COLUMN `logo` VARCHAR(500) NULL AFTER `slug`,
  ADD COLUMN `slogan` VARCHAR(300) NULL AFTER `logo`;

UPDATE `tenants`
SET `slogan` = 'Innovando tu seguridad, protegiendo tu mañana.'
WHERE `slug` = 'seguros-mexa' AND `slogan` IS NULL;
