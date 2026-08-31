'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ItemForm, ItemFormData } from '@/components/items/ItemForm';
import Link from 'next/link';

export default function EditItemPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<ItemFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await fetch(`/api/items/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setItem({
            id: data.item.id,
            name: data.item.name || '',
            srNo: data.item.srNo || '',
            categoryId: data.item.categoryId || '',
            brand: data.item.brand || '',
            itemCode: data.item.itemCode || '',
            modelNumber: data.item.modelNumber || '',
            costPrice: data.item.costPrice,
            retailerPrice: data.item.retailerPrice,
            customerPrice: data.item.customerPrice,
            unit: data.item.unit || 'pcs',
            notes: data.item.notes || '',
          });
        } else {
          setError(data.message || 'Item not found');
        }
      } catch (err) {
        console.error('Failed to load item for editing:', err);
        setError('Error connecting to database');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadItem();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm animate-pulse">
        Loading item specifications...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="glass-card max-w-xl mx-auto rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {error || 'Item Not Found'}
        </h2>
        <Link
          href="/items"
          className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
        >
          ← Back to Items Price Book
        </Link>
      </div>
    );
  }

  return <ItemForm mode="edit" itemId={id} initialData={item} />;
}
