// src/lib/validations/inventaire.ts
import { z } from 'zod';

// ✅ ENUM VALIDATION
const InventaireStatusEnum = z.enum(['EN_COURS', 'TERMINE', 'ARCHIVE']);

// ✅ SCHEMA CRÉATION INVENTAIRE
export const InventaireCreateSchema = z.object({
  nom: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .transform(val => val?.trim() || undefined)
});

// ✅ SCHEMA MISE À JOUR INVENTAIRE
export const InventaireUpdateSchema = InventaireCreateSchema.partial();

// ✅ SCHEMA CRÉATION ITEM INVENTAIRE
export const InventaireItemCreateSchema = z.object({
  ean13: z.string()
    .min(8, 'Code EAN13 trop court (minimum 8 caractères)')
    .max(20, 'Code EAN13 trop long (maximum 20 caractères)')
    .regex(/^[0-9]+$/, 'Le code EAN13 doit contenir uniquement des chiffres')
    .transform(val => val.trim()),
  quantite: z.number()
    .min(1, 'La quantité doit être supérieure à 0')
    .max(9999, 'La quantité ne peut pas dépasser 9999')
    .int('La quantité doit être un nombre entier')
});

// ✅ SCHEMA MISE À JOUR ITEM INVENTAIRE
export const InventaireItemUpdateSchema = z.object({
  quantite: z.number()
    .min(1, 'La quantité doit être supérieure à 0')
    .max(9999, 'La quantité ne peut pas dépasser 9999')
    .int('La quantité doit être un nombre entier')
});

// ✅ SCHEMA FILTRES INVENTAIRE
export const InventaireFiltersSchema = z.object({
  status: z.union([
    InventaireStatusEnum,
    z.literal('ALL')
  ]).optional().default('ALL'),
  search: z.string().optional().default(''),
  dateFrom: z.string().optional().default(''),
  dateTo: z.string().optional().default(''),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20)
});

// ✅ SCHEMA FINALISATION INVENTAIRE
export const InventaireFinishSchema = z.object({
  force: z.boolean().optional().default(false) // Pour forcer même si pas d'items
});

// ✅ TYPES DÉRIVÉS
export type InventaireCreateInput = z.infer<typeof InventaireCreateSchema>;
export type InventaireUpdateInput = z.infer<typeof InventaireUpdateSchema>;
export type InventaireItemCreateInput = z.infer<typeof InventaireItemCreateSchema>;
export type InventaireItemUpdateInput = z.infer<typeof InventaireItemUpdateSchema>;
export type InventaireFiltersInput = z.infer<typeof InventaireFiltersSchema>;
export type InventaireFinishInput = z.infer<typeof InventaireFinishSchema>;

// ✅ SCHEMA VALIDATION FORM DATA (pour les formulaires)
export const InventaireFormSchema = z.object({
  nom: z.string().min(3).max(100),
  description: z.string().max(500).optional()
});

export const InventaireItemFormSchema = z.object({
  ean13: z.string().min(8).max(20),
  quantite: z.string()
    .min(1, 'Quantité requise')
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val > 0 && val <= 9999, 'Quantité invalide (1-9999)')
});

export type InventaireFormInput = z.infer<typeof InventaireFormSchema>;
export type InventaireItemFormInput = z.infer<typeof InventaireItemFormSchema>;