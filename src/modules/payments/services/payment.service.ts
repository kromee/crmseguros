import { NotFoundError } from "@/core/errors/app-error";
import { paymentRepository } from "../repositories/payment.repository";
import type {
  CreatePaymentInput,
  PaymentFilters,
} from "../schemas/payment.schema";

export const paymentService = {
  async create(input: CreatePaymentInput) {
    return paymentRepository.create(input);
  },

  async delete(id: string) {
    const existing = await paymentRepository.findById(id);
    if (!existing) throw new NotFoundError("Pago no encontrado");
    return paymentRepository.delete(id);
  },

  async listByPolicy(policyId: string) {
    return paymentRepository.listByPolicy(policyId);
  },

  async list(filters: PaymentFilters) {
    return paymentRepository.list(filters);
  },

  async policyPaymentSummary(policyId: string) {
    return paymentRepository.sumByPolicy(policyId);
  },

  async annualSummary(year: number) {
    return paymentRepository.annualSummary(year);
  },

  async totalPremiumsAnnual(year: number) {
    return paymentRepository.totalPremiumsAnnual(year);
  },
};
