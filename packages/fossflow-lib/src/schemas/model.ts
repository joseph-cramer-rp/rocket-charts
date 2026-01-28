import { z } from 'zod';
import { INITIAL_DATA } from '../config';
import { constrainedStrings } from './common';
import { modelItemsSchema } from './modelItems';
import { viewsSchema } from './views';
import { validateModel } from './validation';
import { iconsSchema } from './icons';
import { colorsSchema } from './colors';

// Icon override schema - allows overriding properties of pack icons
// Currently supports url2D and scale2D, extensible for future properties
export const iconOverrideSchema = z.object({
  url2D: z.string().optional(),
  scale2D: z.number().min(0.1).max(3).optional()
});

export const iconOverridesSchema = z.record(z.string(), iconOverrideSchema);

export const modelSchema = z
  .object({
    version: z.string().max(10).optional(),
    title: constrainedStrings.name,
    description: constrainedStrings.description.optional(),
    items: modelItemsSchema,
    views: viewsSchema,
    icons: iconsSchema,
    colors: colorsSchema,
    iconOverrides: iconOverridesSchema.optional()
  })
  .superRefine((model, ctx) => {
    const issues = validateModel({ ...INITIAL_DATA, ...model });

    issues.forEach((issue) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        params: issue.params,
        message: issue.message
      });
    });
  });
