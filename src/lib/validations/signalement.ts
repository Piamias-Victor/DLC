// src/lib/validations/signalement.ts
import { z } from 'zod';

export const SignalementCreateSchema = z.object({
  codeBarres: z.string().min(8).max(50).trim(),
  quantite: z.number().min(1).max(10000),
  datePeremption: z.string()
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'Date doit être future et valide')
    .transform((dateStr) => new Date(dateStr)),
  commentaire: z.string().max(500).optional().transform(val => val?.trim() || undefined)
});

export const SignalementUpdateSchema = SignalementCreateSchema.partial();

export type SignalementCreateInput = z.infer<typeof SignalementCreateSchema>;
export type SignalementUpdateInput = z.infer<typeof SignalementUpdateSchema>;