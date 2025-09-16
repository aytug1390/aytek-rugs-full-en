export type Category = {
  slug: string;
  name: string;
  image: string;
  blurb?: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "traditional",
    name: "Traditional",
    image: "/images/categories/traditional.jpg",
    blurb: "Classic motifs & timeless palettes.",
  },
  {
    slug: "vintage",
    name: "Vintage",
    image: "/images/categories/vintage.jpg",
    blurb: "Aged character with soft patina.",
  },
  {
    slug: "kilim",
    name: "Kilim",
    image: "/images/categories/kilim.jpg",
    blurb: "Flat-woven, lightweight & versatile.",
  },
  {
    slug: "modern",
    name: "Modern",
    image: "/images/categories/modern.jpg",
    blurb: "Contemporary lines & bold forms.",
  },
  {
    slug: "tribal",
    name: "Tribal",
    image: "/images/categories/tribal.jpg",
    blurb: "Geometric patterns & village weaves.",
  },
  {
    slug: "silk",
    name: "Silk Rugs",
    image: "/images/categories/silk.jpg",
    blurb: "Luxurious sheen, refined details.",
  },
  {
    slug: "antique-rug",
    name: "Antique Rug",
    image: "/images/categories/antique-rug.jpg",
    blurb: "Collectible pieces 80–100+ years.",
  },
  {
    slug: "antique-kilim",
    name: "Antique Kilim",
    image: "/images/categories/antique-kilim.jpg",
    blurb: "Historic flat-weaves with soul.",
  },
  {
    slug: "anatolian",
    name: "Anatolian Rug",
    image: "/images/categories/anatolian.jpg",
    blurb: "Cappadocia/Kayseri heritage weaves.",
  },
];
