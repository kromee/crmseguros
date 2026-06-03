-- SAAS 0: Multi-tenant foundation

-- CreateTable plans
CREATE TABLE `plans` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `maxUsers` INTEGER NOT NULL DEFAULT 2,
    `storageLimitMb` INTEGER NOT NULL DEFAULT 5120,
    `priceMonthly` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `plans_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable tenants
CREATE TABLE `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    `planId` VARCHAR(191) NOT NULL,
    `maxUsers` INTEGER NOT NULL DEFAULT 2,
    `storageLimitMb` INTEGER NOT NULL DEFAULT 5120,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `tenants_slug_key`(`slug`),
    INDEX `tenants_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable subscriptions
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `term` ENUM('MONTHLY', 'ANNUAL', 'MONTHS_24', 'YEARS_4') NOT NULL,
    `status` ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `startsAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `subscriptions_tenantId_status_idx`(`tenantId`, `status`),
    INDEX `subscriptions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable licenses
CREATE TABLE `licenses` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `keyHash` VARCHAR(255) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `term` ENUM('MONTHLY', 'ANNUAL', 'MONTHS_24', 'YEARS_4') NOT NULL,
    `status` ENUM('AVAILABLE', 'USED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'AVAILABLE',
    `tenantId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `usedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `licenses_code_key`(`code`),
    INDEX `licenses_status_idx`(`status`),
    INDEX `licenses_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Expand UserRole before data migration
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'USER', 'SUPER_ADMIN', 'TENANT_ADMIN') NOT NULL DEFAULT 'USER';

-- Add tenantId columns (nullable for backfill)
ALTER TABLE `users` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `contacts` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `policies` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `pension_services` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `vehicle_services` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `prospects` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `activities` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `calendar_events` ADD COLUMN `tenantId` VARCHAR(191) NULL;
ALTER TABLE `audit_log` ADD COLUMN `tenantId` VARCHAR(191) NULL;

-- Default plan + tenant (Seguros Mexa)
INSERT INTO `plans` (`id`, `slug`, `name`, `maxUsers`, `storageLimitMb`, `priceMonthly`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('00000000-0000-4000-8000-000000000001', 'plan-agencia', 'Plan Agencia', 2, 5120, 2500.00, true, NOW(3), NOW(3));

INSERT INTO `tenants` (`id`, `name`, `slug`, `status`, `planId`, `maxUsers`, `storageLimitMb`, `createdAt`, `updatedAt`)
VALUES ('00000000-0000-4000-8000-000000000002', 'Seguros Mexa', 'seguros-mexa', 'ACTIVE', '00000000-0000-4000-8000-000000000001', 2, 5120, NOW(3), NOW(3));

INSERT INTO `subscriptions` (`id`, `tenantId`, `planId`, `term`, `status`, `startsAt`, `expiresAt`, `createdAt`, `updatedAt`)
VALUES (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'ANNUAL',
  'ACTIVE',
  NOW(3),
  DATE_ADD(NOW(3), INTERVAL 1 YEAR),
  NOW(3),
  NOW(3)
);

-- Backfill tenantId
UPDATE `users` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `contacts` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `policies` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `pension_services` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `vehicle_services` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `payments` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `prospects` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `activities` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `calendar_events` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;
UPDATE `audit_log` SET `tenantId` = '00000000-0000-4000-8000-000000000002' WHERE `tenantId` IS NULL;

UPDATE `users` SET `role` = 'TENANT_ADMIN' WHERE `role` = 'ADMIN';

-- NOT NULL on business tables (users.tenantId stays nullable for SUPER_ADMIN)
ALTER TABLE `contacts` MODIFY `tenantId` VARCHAR(191) NOT NULL;
ALTER TABLE `policies` MODIFY `tenantId` VARCHAR(191) NOT NULL;
ALTER TABLE `pension_services` MODIFY `tenantId` VARCHAR(191) NOT NULL;
ALTER TABLE `vehicle_services` MODIFY `tenantId` VARCHAR(191) NOT NULL;
ALTER TABLE `payments` MODIFY `tenantId` VARCHAR(191) NOT NULL;
ALTER TABLE `prospects` MODIFY `tenantId` VARCHAR(191) NOT NULL;
ALTER TABLE `activities` MODIFY `tenantId` VARCHAR(191) NOT NULL;
ALTER TABLE `calendar_events` MODIFY `tenantId` VARCHAR(191) NOT NULL;

-- Shrink UserRole enum
ALTER TABLE `users` MODIFY `role` ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'USER') NOT NULL DEFAULT 'USER';

-- Drop old uniques, add composite uniques
DROP INDEX `contacts_code_key` ON `contacts`;
DROP INDEX `prospects_code_key` ON `prospects`;
DROP INDEX `policies_policyNumber_key` ON `policies`;

CREATE UNIQUE INDEX `contacts_tenantId_code_key` ON `contacts`(`tenantId`, `code`);
CREATE UNIQUE INDEX `prospects_tenantId_code_key` ON `prospects`(`tenantId`, `code`);
CREATE UNIQUE INDEX `policies_tenantId_policyNumber_key` ON `policies`(`tenantId`, `policyNumber`);

CREATE INDEX `users_tenantId_idx` ON `users`(`tenantId`);
CREATE INDEX `contacts_tenantId_type_status_idx` ON `contacts`(`tenantId`, `type`, `status`);
CREATE INDEX `policies_tenantId_contactId_idx` ON `policies`(`tenantId`, `contactId`);
CREATE INDEX `pension_services_tenantId_contactId_idx` ON `pension_services`(`tenantId`, `contactId`);
CREATE INDEX `vehicle_services_tenantId_contactId_idx` ON `vehicle_services`(`tenantId`, `contactId`);
CREATE INDEX `payments_tenantId_policyId_idx` ON `payments`(`tenantId`, `policyId`);
CREATE INDEX `prospects_tenantId_stage_status_idx` ON `prospects`(`tenantId`, `stage`, `status`);
CREATE INDEX `activities_tenantId_contactId_idx` ON `activities`(`tenantId`, `contactId`);
CREATE INDEX `calendar_events_tenantId_userId_startDate_idx` ON `calendar_events`(`tenantId`, `userId`, `startDate`);
CREATE INDEX `audit_log_tenantId_entity_entityId_idx` ON `audit_log`(`tenantId`, `entity`, `entityId`);

-- Foreign keys
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `policies` ADD CONSTRAINT `policies_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pension_services` ADD CONSTRAINT `pension_services_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `vehicle_services` ADD CONSTRAINT `vehicle_services_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `activities` ADD CONSTRAINT `activities_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
