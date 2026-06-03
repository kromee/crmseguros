-- Catálogo SaaS completo (2, 5, 10 usuarios)
-- Fuente de verdad en código: src/core/tenant/saas-catalog.ts
-- En prod preferir: npm run db:sync-catalog

INSERT INTO `plans` (`id`, `slug`, `name`, `maxUsers`, `storageLimitMb`, `priceMonthly`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'plan-agencia', 'Plan Agencia', 2, 5120, 2500.00, true, NOW(3), NOW(3)),
  ('00000000-0000-4000-8000-000000000002', 'plan-equipo', 'Plan Equipo', 5, 12800, 4500.00, true, NOW(3), NOW(3)),
  ('00000000-0000-4000-8000-000000000003', 'plan-empresa', 'Plan Empresa', 10, 25600, 7500.00, true, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `maxUsers` = VALUES(`maxUsers`),
  `storageLimitMb` = VALUES(`storageLimitMb`),
  `priceMonthly` = VALUES(`priceMonthly`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = NOW(3);
