// src/lib/validations/rotation.ts - VERSION COMPLÈTE AVEC PRIX D'ACHAT
import { z } from 'zod';

// Schema pour création/mise à jour d'une rotation AVEC prix
export const ProductRotationSchema = z.object({
  ean13: z.string()
    .min(8, 'EAN13 trop court')
    .max(20, 'EAN13 trop long')
    .regex(/^[0-9]+$/, 'EAN13 doit contenir uniquement des chiffres')
    .transform(val => val.trim()),
  
  rotationMensuelle: z.number()
    .min(0, 'Rotation doit être positive')
    .max(1000, 'Rotation trop élevée (max 1000)')
    .transform(val => Math.round(val * 100) / 100), // Arrondir à 2 décimales
    
  // 🆕 NOUVEAU : Prix d'achat optionnel
  prixAchatUnitaire: z.number()
    .min(0, 'Prix d\'achat doit être positif')
    .max(9999.99, 'Prix d\'achat trop élevé (max 9999.99€)')
    .transform(val => Math.round(val * 100) / 100) // Arrondir à 2 décimales
    .optional()
});

// 🆕 Schema pour import CSV avec prix (tous les champs requis dans CSV)
export const RotationImportWithPriceSchema = z.object({
  ean13: z.string().min(8).max(20),
  rotationMensuelle: z.number().min(0).max(1000),
  prixAchatUnitaire: z.number().min(0).max(9999.99)
});

// 🆕 Schema pour import CSV SANS prix (rétro-compatibilité)
export const RotationImportLegacySchema = z.object({
  ean13: z.string().min(8).max(20),
  rotationMensuelle: z.number().min(0).max(1000)
});

// 🆕 Union des deux formats pour flexibilité
export const RotationImportUnionSchema = z.union([
  RotationImportWithPriceSchema,
  RotationImportLegacySchema
]);

// Schema pour import CSV (mis à jour pour supporter les deux formats)
export const RotationImportSchema = z.object({
  data: z.array(RotationImportUnionSchema)
    .min(1, 'Au moins une rotation doit être fournie')
    .max(10000, 'Maximum 10000 rotations par import')
});

// Schema pour filtres des rotations (étendu avec prix)
export const RotationFiltersSchema = z.object({
  search: z.string().optional().default(''),
  rotationMin: z.string().optional().default(''),
  rotationMax: z.string().optional().default(''),
  dateMAJFrom: z.string().optional().default(''),
  dateMAJTo: z.string().optional().default(''),
  // 🆕 Filtres prix
  prixMin: z.string().optional().default(''),
  prixMax: z.string().optional().default(''),
  avecPrix: z.boolean().optional().default(false), // Filtrer seulement les produits avec prix
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

// 🆕 Nouveaux types pour l'import avec prix
export type RotationImportWithPrice = z.infer<typeof RotationImportWithPriceSchema>;
export type RotationImportLegacy = z.infer<typeof RotationImportLegacySchema>;
export type RotationImportData = z.infer<typeof RotationImportUnionSchema>;