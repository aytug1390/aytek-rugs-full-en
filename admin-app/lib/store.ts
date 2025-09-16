import fs from "node:fs/promises";
import path from "node:path";
const DATA_PATH = path.join(process.cwd(), "data", "products.json");

export type Product = {
  product_id: string;
  title?: string;
  price?: number;
  origin?: string;
  size_text?: string;
  color?: string[]; // "Red,Blue" → ["Red","Blue"]
  image_url?: string; // first image or primary
};

export async function readAll(): Promise<Product[]> {
  try {
    const buf = await fs.readFile(DATA_PATH);
    return JSON.parse(buf.toString() || "[]");
  } catch {
    return [];
  }
}

export async function writeAll(items: Product[]): Promise<void> {
  const tmp = DATA_PATH + ".tmp";
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(items, null, 2));
  await fs.rename(tmp, DATA_PATH);
}
