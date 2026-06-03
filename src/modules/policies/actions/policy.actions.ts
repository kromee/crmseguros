"use server";

import { revalidatePath } from "next/cache";
import { AppError, ValidationError } from "@/core/errors/app-error";
import { assertCanUpload } from "@/core/tenant/entitlements";
import { requireTenantSession } from "@/core/tenant";
import { isPolicyClosedForFiles } from "@/core/utils/expiry";
import type { ActionResult } from "@/core/types/action-result";
import { prisma } from "@/infrastructure/prisma/client";
import { saveFile, deleteFile } from "@/infrastructure/storage/local-storage";
import { TENANT_UPLOAD_CATEGORIES } from "@/infrastructure/storage/tenant-paths";
import {
  createPolicySchema,
  updatePolicySchema,
  type CreatePolicyInput,
  type UpdatePolicyInput,
} from "../schemas/policy.schema";
import { policyService } from "../services/policy.service";

const POLICY_FILES_LOCKED_MSG =
  "No se pueden subir ni modificar archivos en una póliza vencida o cancelada";

async function assertPolicyAllowsFileChanges(tenantId: string, policyId: string) {
  const policy = await prisma.policy.findFirst({
    where: { id: policyId, tenantId },
    select: { status: true, endDate: true },
  });
  if (!policy) throw new ValidationError("Póliza no encontrada");
  if (isPolicyClosedForFiles(policy.status, policy.endDate)) {
    throw new ValidationError(POLICY_FILES_LOCKED_MSG);
  }
}

export async function createPolicyAction(
  input: CreatePolicyInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const parsed = createPolicySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const policy = await policyService.create(
      session.tenantId,
      parsed.data,
      session.userId
    );
    revalidatePath(`/contacts/${policy.contactId}`);
    revalidatePath("/services");
    return { ok: true, data: { id: policy.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al crear póliza",
    };
  }
}

export async function renewPolicyAction(
  oldPolicyId: string,
  input: CreatePolicyInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const parsed = createPolicySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const newPolicy = await policyService.renew(
      session.tenantId,
      oldPolicyId,
      parsed.data,
      session.userId
    );
    revalidatePath(`/contacts/${newPolicy.contactId}`);
    revalidatePath("/services");
    revalidatePath("/calendar");
    return { ok: true, data: { id: newPolicy.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al renovar póliza",
    };
  }
}

export async function updatePolicyAction(
  id: string,
  input: UpdatePolicyInput
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = updatePolicySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const updated = await policyService.update(
      session.tenantId,
      id,
      parsed.data,
      session.userId
    );
    revalidatePath(`/contacts/${updated.contactId}`);
    revalidatePath("/services");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al actualizar póliza",
    };
  }
}

export async function uploadPolicyFileAction(
  policyId: string,
  formData: FormData
): Promise<ActionResult<{ filePath: string }>> {
  try {
    const session = await requireTenantSession();
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "No se recibió archivo" };

    await assertPolicyAllowsFileChanges(session.tenantId, policyId);

    const policy = await prisma.policy.findFirst({
      where: { id: policyId, tenantId: session.tenantId },
      select: { id: true, contactId: true, policyFile: true },
    });
    if (!policy) return { ok: false, error: "Póliza no encontrada" };

    await assertCanUpload(
      session.tenantId,
      file.size,
      policy.policyFile ? [policy.policyFile] : []
    );

    if (policy.policyFile) {
      await deleteFile(policy.policyFile);
    }

    const result = await saveFile(file, TENANT_UPLOAD_CATEGORIES.policies, {
      tenantId: session.tenantId,
    });

    await prisma.policy.update({
      where: { id: policyId, tenantId: session.tenantId },
      data: { policyFile: result.path },
    });

    revalidatePath(`/contacts/${policy.contactId}`);
    revalidatePath("/services");
    return { ok: true, data: { filePath: result.path } };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error al subir archivo",
    };
  }
}

export async function uploadVehiclePhotoAction(
  policyId: string,
  formData: FormData
): Promise<ActionResult<{ filePath: string }>> {
  try {
    const session = await requireTenantSession();
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "No se recibió archivo" };

    await assertPolicyAllowsFileChanges(session.tenantId, policyId);

    const policy = await prisma.policy.findFirst({
      where: { id: policyId, tenantId: session.tenantId },
      select: { id: true, contactId: true, type: true, vehiclePhoto: true },
    });
    if (!policy) return { ok: false, error: "Póliza no encontrada" };
    if (policy.type !== "AUTO") {
      return { ok: false, error: "La foto del vehículo solo aplica a seguros de auto" };
    }

    await assertCanUpload(
      session.tenantId,
      file.size,
      policy.vehiclePhoto ? [policy.vehiclePhoto] : []
    );

    if (policy.vehiclePhoto) {
      await deleteFile(policy.vehiclePhoto);
    }

    const result = await saveFile(file, TENANT_UPLOAD_CATEGORIES.policyVehicles, {
      tenantId: session.tenantId,
    });

    await prisma.policy.update({
      where: { id: policyId, tenantId: session.tenantId },
      data: { vehiclePhoto: result.path },
    });

    revalidatePath(`/contacts/${policy.contactId}`);
    revalidatePath("/services");
    return { ok: true, data: { filePath: result.path } };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error al subir foto del vehículo",
    };
  }
}

export async function removeVehiclePhotoAction(
  policyId: string
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await assertPolicyAllowsFileChanges(session.tenantId, policyId);

    const policy = await prisma.policy.findFirst({
      where: { id: policyId, tenantId: session.tenantId },
      select: { id: true, contactId: true, vehiclePhoto: true },
    });
    if (!policy) return { ok: false, error: "Póliza no encontrada" };
    if (policy.vehiclePhoto) {
      await deleteFile(policy.vehiclePhoto);
    }
    await prisma.policy.update({
      where: { id: policyId, tenantId: session.tenantId },
      data: { vehiclePhoto: null },
    });
    revalidatePath(`/contacts/${policy.contactId}`);
    revalidatePath("/services");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al eliminar foto del vehículo",
    };
  }
}

export async function removePolicyFileAction(
  policyId: string
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await assertPolicyAllowsFileChanges(session.tenantId, policyId);

    const policy = await prisma.policy.findFirst({
      where: { id: policyId, tenantId: session.tenantId },
      select: { id: true, contactId: true, policyFile: true },
    });
    if (!policy) return { ok: false, error: "Póliza no encontrada" };
    if (policy.policyFile) {
      await deleteFile(policy.policyFile);
    }
    await prisma.policy.update({
      where: { id: policyId, tenantId: session.tenantId },
      data: { policyFile: null },
    });
    revalidatePath(`/contacts/${policy.contactId}`);
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al eliminar archivo",
    };
  }
}

export async function deletePolicyAction(
  id: string,
  contactId: string
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await policyService.remove(session.tenantId, id, session.userId);
    revalidatePath(`/contacts/${contactId}`);
    revalidatePath("/services");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al eliminar póliza",
    };
  }
}
