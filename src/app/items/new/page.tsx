'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ItemForm, ItemFormData } from '@/components/items/ItemForm';

function NewItemContent() {
  const searchParams = useSearchParams();

  const duplicateFrom = searchParams.get('duplicateFrom');
  const name = searchParams.get('name') || '';
  const srNo = searchParams.get('srNo') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const brand = searchParams.get('brand') || '';
  const costPrice = searchParams.get('costPrice') || '';
  const retailerPrice = searchParams.get('retailerPrice') || '';
  const customerPrice = searchParams.get('customerPrice') || '';
  const unit = searchParams.get('unit') || 'pcs';
  const notes = searchParams.get('notes') || '';

  const initialData: Partial<ItemFormData> = {
    name,
    srNo,
    categoryId,
    brand,
    costPrice,
    retailerPrice,
    customerPrice,
    unit,
    notes,
  };

  return <ItemForm mode="create" initialData={duplicateFrom ? initialData : undefined} />;
}

export default function NewItemPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading item form...</div>}>
      <NewItemContent />
    </Suspense>
  );
}
