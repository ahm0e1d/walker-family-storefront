import { Product } from "@/types/product";

export const initialProducts: Product[] = [
  {
    id: "1",
    name: "خشب مقطع",
    description: "خشب عالي الجودة للبناء والتصنيع",
    price: 35000,
    quantity: 150,
    image: "🪵",
    rating: 4,
  },
  {
    id: "2",
    name: "ملابس",
    description: "ملابس متنوعة بأفضل الأسعار",
    price: 50000,
    quantity: 120,
    image: "👕",
    rating: 5,
  },
  {
    id: "3",
    name: "دواجن",
    description: "دواجن طازجة ومجمدة",
    price: 25000,
    quantity: 150,
    image: "🐔",
    rating: 4,
  },
  {
    id: "4",
    name: "خضراوات",
    description: "خضراوات طازجة من المزرعة",
    price: 35000,
    quantity: 150,
    image: "🥬",
    rating: 5,
  },
  {
    id: "5",
    name: "نفط وغاز",
    description: "منتجات نفطية وغازية",
    price: 55000,
    quantity: 60,
    image: "⛽",
    rating: 4,
  },
];
