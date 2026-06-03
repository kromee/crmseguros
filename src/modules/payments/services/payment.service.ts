import { NotFoundError } from "@/core/errors/app-error";
import { paymentRepository } from "../repositories/payment.repository";
import type {
  CreatePaymentInput,
  PaymentFilters,
} from "../schemas/payment.schema";

export const paymentService = {
  async create(tenantId: string, input: CreatePaymentInput) {
    return paymentRepository.create(tenantId, input);
  },

  async delete(tenantId: string, id: string) {
    const existing = await paymentRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Pago no encontrado");
    return paymentRepository.delete(tenantId, id);
  },

  async listByPolicy(tenantId: string, policyId: string) {
    return paymentRepository.listByPolicy(tenantId, policyId);
  },

  async list(tenantId: string, filters: PaymentFilters) {
    return paymentRepository.list(tenantId, filters);
  },

  async policyPaymentSummary(tenantId: string, policyId: string) {
    return paymentRepository.sumByPolicy(tenantId, policyId);
  },

  async annualSummary(tenantId: string, year: number) {
    return paymentRepository.annualSummary(tenantId, year);
  },

  async totalPremiumsAnnual(tenantId: string, year: number) {
    return paymentRepository.totalPremiumsAnnual(tenantId, year);
  },
};
