import jkCatalogJson from './jkCatalog.json';

export type JkCatalogItem = {
  name: string;
  costPrice: number;
  catalogSrNo?: number;
  variantSrNo?: number;
  catalogGroup?: string;
  sortOrder: number;
  sourcePage: number;
  unit?: string;
};

export type JkCatalogCategory = {
  name: string;
  parentId?: string;
  sourcePage: number;
  sortOrder: number;
  items: JkCatalogItem[];
};

export const jkCatalog = jkCatalogJson as JkCatalogCategory[];
