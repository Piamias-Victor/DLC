// src/lib/validations/rotation.ts
import { z } from 'zod';

// Schema pour création/mise à jour d'une rotation
export const ProductRotationSchema = z.object({
  ean13: z.string()
    .min(8, 'EAN13 trop court')
    .max(20, 'EAN13 trop long')
    .regex(/^[0-9]+$/, 'EAN13 doit contenir uniquement des chiffres')
    .transform(val => val.trim()),
  
  rotationMensuelle: z.number()
    .min(0, 'Rotation doit être positive')
    .max(1000, 'Rotation trop élevée (max 1000)')
    .transform(val => Math.round(val * 100) / 100) // Arrondir à 2 décimales
});

// Schema pour import CSV
export const RotationImportSchema = z.object({
  data: z.array(ProductRotationSchema)
    .min(1, 'Au moins une rotation doit être fournie')
    .max(10000, 'Maximum 10000 rotations par import')
});

// Schema pour filtres des rotations
export const RotationFiltersSchema = z.object({
  search: z.string().optional().default(''),
  rotationMin: z.string().optional().default(''),
  rotationMax: z.string().optional().default(''),
  dateMAJFrom: z.string().optional().default(''),
  dateMAJTo: z.string().optional().default(''),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0)
});

// Schema pour recalcul d'urgence
export const RecalculateUrgencySchema = z.object({
  signalementIds: z.array(z.string().cuid()).optional(),
  all: z.boolean().optional().default(false)
}).refine(
  data => data.signalementIds?.length || data.all,
  'Soit signalementIds soit all doit être fourni'
);

// Types dérivés
export type ProductRotationInput = z.infer<typeof ProductRotationSchema>;
export type RotationImportInput = z.infer<typeof RotationImportSchema>;
export type RotationFiltersInput = z.infer<typeof RotationFiltersSchema>;
export type RecalculateUrgencyInput = z.infer<typeof RecalculateUrgencySchema>;