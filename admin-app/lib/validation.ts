import { z } from "zod";

export const ProductSchema = z.object({
  product_id: z.string().min(1),
  title: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  origin: z.string().optional(),
  size_text: z.string().optional(),
  color: z
    .union([z.string(), z.array(z.string())])
    .transform((val) =>
      Array.isArray(val)
        ? val.filter(Boolean).map((s) => s.trim())
        : (val || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
    )
    .optional(),
  image_url: z.string().url().optional(),
});

export const ProductArraySchema = z.array(ProductSchema);
export type ProductInput = z.infer<typeof ProductSchema>;
