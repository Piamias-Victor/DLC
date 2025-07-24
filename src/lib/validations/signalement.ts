// src/lib/validations/signalement.ts - Mise à jour avec status
import { z } from 'zod';

const SignalementStatusEnum = z.enum(['EN_ATTENTE', 'EN_COURS', 'A_DESTOCKER', 'DETRUIT']);

export const SignalementCreateSchema = z.object({
  codeBarres: z.string().min(8).max(50).trim(),
  quantite: z.number().min(1).max(10000),
  datePeremption: z.string()
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'Date doit être future et valide')
    .transform((dateStr) => new Date(dateStr)),
  commentaire: z.string().max(500).optional().transform(val => val?.trim() || undefined),
  status: SignalementStatusEnum.default('EN_ATTENTE')
});

export const SignalementUpdateSchema = SignalementCreateSchema.partial();

// Schema pour les filtres
export const DashboardFiltersSchema = z.object({
  search: z.string().optional().default(''),
  status: z.union([SignalementStatusEnum, z.literal('ALL')]).optional().default('ALL'),
  urgency: z.enum(['low', 'medium', 'high', 'critical', 'ALL']).optional().default('ALL'),
  datePeremptionFrom: z.string().optional().default(''),
  datePeremptionTo: z.string().optional().default(''),
});

// Schema pour le changement d'état en masse
export const BulkUpdateStatusSchema = z.object({
  signalementIds: z.array(z.string().cuid()).min(1, 'Au moins un signalement doit être sélectionné'),
  newStatus: SignalementStatusEnum
});

export type SignalementCreateInput = z.infer<typeof SignalementCreateSchema>;
export type SignalementUpdateInput = z.infer<typeof SignalementUpdateSchema>;
export type DashboardFiltersInput = z.infer<typeof DashboardFiltersSchema>;
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusSchema>;