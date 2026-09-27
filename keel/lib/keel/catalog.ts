import { figure } from "./figures";
import { MODELED_FETCHED_AT, type CatalogProduct } from "./types";

const at = MODELED_FETCHED_AT;

function modeled(value: number, label: string) {
  return figure(value, "modeled", at, label);
}

export function modeledCatalog(): CatalogProduct[] {
  return [
    {
      id: "book-light",
      name: "Clip-on amber book light",
      category: "Home reading lights",
      offer: "Warm LED, USB-C charge, clip sized for paperbacks.",
      retailUsd: modeled(24, "Modeled retail price"),
      unitsSold7d: modeled(180, "Modeled TikTok Shop units, 7 days"),
      categoryUnits7d: modeled(4200, "Modeled category units, 7 days"),
      reviewCount: modeled(640, "Modeled review count"),
      rating: modeled(4.6, "Modeled rating"),
      creatorViews: modeled(120000, "Modeled creator views"),
      alibabaUnitUsd: modeled(3.4, "Modeled Alibaba unit cost"),
      alibabaUrl: null,
      temuUnitUsd: modeled(4.1, "Modeled Temu unit cost"),
      temuUrl: null,
      shippingUsd: modeled(2.2, "Modeled inbound shipping per unit"),
    },
    {
      id: "lunch-box",
      name: "Collapsible silicone lunch box",
      category: "Kitchen storage",
      offer: "Folds flat, leak-resistant lid, one-quart size.",
      retailUsd: modeled(18, "Modeled retail price"),
      unitsSold7d: modeled(90, "Modeled TikTok Shop units, 7 days"),
      categoryUnits7d: modeled(8000, "Modeled category units, 7 days"),
      reviewCount: modeled(2100, "Modeled review count"),
      rating: modeled(4.4, "Modeled rating"),
      creatorViews: modeled(64000, "Modeled creator views"),
      alibabaUnitUsd: modeled(2.1, "Modeled Alibaba unit cost"),
      alibabaUrl: null,
      temuUnitUsd: modeled(2.8, "Modeled Temu unit cost"),
      temuUrl: null,
      shippingUsd: modeled(3.4, "Modeled inbound shipping per unit"),
    },
    {
      id: "cable-clips",
      name: "Magnetic cable clip 6-pack",
      category: "Desk accessories",
      offer: "Six clips, reusable adhesive, holds a charging cable.",
      retailUsd: modeled(12, "Modeled retail price"),
      unitsSold7d: modeled(40, "Modeled TikTok Shop units, 7 days"),
      categoryUnits7d: modeled(15000, "Modeled category units, 7 days"),
      reviewCount: modeled(80, "Modeled review count"),
      rating: modeled(4.2, "Modeled rating"),
      creatorViews: modeled(18000, "Modeled creator views"),
      alibabaUnitUsd: modeled(0.45, "Modeled Alibaba unit cost"),
      alibabaUrl: null,
      temuUnitUsd: modeled(0.7, "Modeled Temu unit cost"),
      temuUrl: null,
      shippingUsd: modeled(1.1, "Modeled inbound shipping per unit"),
    },
    {
      id: "garment-steamer",
      name: "Mini garment steamer",
      category: "Garment care",
      offer: "Compact handheld steamer with a 60 ml tank.",
      retailUsd: modeled(32, "Modeled retail price"),
      unitsSold7d: modeled(25, "Modeled TikTok Shop units, 7 days"),
      categoryUnits7d: modeled(2600, "Modeled category units, 7 days"),
      reviewCount: modeled(15, "Modeled review count"),
      rating: modeled(4.1, "Modeled rating"),
      creatorViews: modeled(9000, "Modeled creator views"),
      alibabaUnitUsd: modeled(7.8, "Modeled Alibaba unit cost"),
      alibabaUrl: null,
      temuUnitUsd: modeled(9.5, "Modeled Temu unit cost"),
      temuUrl: null,
      shippingUsd: modeled(4, "Modeled inbound shipping per unit"),
    },
  ];
}
