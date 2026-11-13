import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { InventoryItem } from '../../types';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Building,
  CheckCircle,
  Tag,
  DollarSign,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { activeRole } = useAuth();
  const { language, formatTaka } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>(() => StorageService.getInventory());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InventoryItem | null>(null);

  // Form State
  const [itemName, setItemName] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<any>('Furniture');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemUnit, setItemUnit] = useState<string>('Units');
  const [itemLocation, setItemLocation] = useState<string>('Room 101');
  const [itemCondition, setItemCondition] = useState<any>('Good');
  const [itemCost, setItemCost] = useState<number>(5000);

  const canManage = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'librarian' || activeRole === 'master_admin';

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Furniture');
    setItemQty(10);
    setItemUnit('Units');
    setItemLocation('Room 101');
    setItemCondition('Good');
    setItemCost(5000);
    setShowAddModal(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQty(item.quantity);
    setItemUnit(item.unit);
    setItemLocation(item.location);
    setItemCondition(item.condition);
    setItemCost(item.cost);
    setShowAddModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    if (editingItem) {
      const updated: InventoryItem = {
        ...editingItem,
        name: itemName.trim(),
        category: itemCategory,
        quantity: itemQty,
        unit: itemUnit.trim() || 'Units',
        location: itemLocation.trim() || 'Room 101',
        condition: itemCondition,
        cost: itemCost,
      };
      StorageService.updateInventoryItem(updated);
      setItems(StorageService.getInventory());
      setShowAddModal(false);
      setEditingItem(null);
    } else {
      const newItem: InventoryItem = {
        id: `inv_item_${Date.now()}`,
        itemCode: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: itemName.trim(),
        category: itemCategory,
        quantity: itemQty,
        unit: itemUnit.trim() || 'Units',
        location: itemLocation.trim() || 'Room 101',
        condition: itemCondition,
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: itemCost,
      };
      StorageService.addInventoryItem(newItem);
      setItems(StorageService.getInventory());
      setShowAddModal(false);
      setItemName('');
    }
  };

  const handleConfirmDeleteItem = () => {
    if (!deleteConfirmItem) return;
    StorageService.deleteInventoryItem(deleteConfirmItem.id);
    setItems(StorageService.getInventory());
    setDeleteConfirmItem(null);
  };

  const filteredItems = items.filter((i) => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q) || i.location.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'বিদ্যালয়ের আসবাবপত্র ও সম্পদ তালিকা (Assets)' : 'School Inventory & Asset Registry'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'শ্রেণিকক্ষের বেঞ্চ, টেবিল, চেয়ার, কম্পিউটার, ল্যাবরেটরি সরঞ্জাম এবং সম্পদ তথ্য'
              : 'Classroom furniture, computers, laboratory apparatus, and sports assets'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenAddItem}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন সম্পদ / আসবাবপত্র যোগ' : 'Add Asset / Stock'}</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'সম্পদের নাম, কোড বা অবস্থান দিয়ে খুঁজুন...' : 'Search items by name, code, or location...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
          >
            <option value="all">{language === 'bn' ? 'সকল ক্যাটাগরি (All Categories)' : 'All Categories'}</option>
            <option value="Furniture">{language === 'bn' ? 'আসবাবপত্র (Furniture)' : 'Furniture'}</option>
            <option value="Science Lab">{language === 'bn' ? 'বিজ্ঞানাগার (Science Lab)' : 'Science Lab'}</option>
            <option value="IT & Computer">{language === 'bn' ? 'কম্পিউটার ও আইটি (IT & Computer)' : 'IT & Computer'}</option>
            <option value="Sports">{language === 'bn' ? 'ক্রীড়া সামগ্রী (Sports)' : 'Sports Goods'}</option>
            <option value="Stationery">{language === 'bn' ? 'স্টেশনারি (Stationery)' : 'Stationery'}</option>
            <option value="Electrical">{language === 'bn' ? 'বৈদ্যুতিক সরঞ্জাম (Electrical)' : 'Electrical'}</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location / Room</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-center">Condition</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                {canManage && <th className="py-3 px-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-8 text-center text-slate-400">
                    {language === 'bn' ? 'কোনো আসবাবপত্র বা সম্পদ পাওয়া যায়নি।' : 'No school assets or inventory items found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{item.itemCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-700">{item.category}</td>
                    <td className="py-3 px-4 text-slate-600">{item.location}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.condition === 'Good'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.condition === 'Needs Repair'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {formatTaka(item.cost)}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="px-2 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg flex items-center space-x-1 transition-colors"
                            title={language === 'bn' ? 'সম্পদ সম্পাদনা করুন' : 'Edit Asset'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={language === 'bn' ? 'সম্পদ মুছুন' : 'Delete Asset'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingItem
                  ? (language === 'bn' ? 'সম্পদ তথ্য সম্পাদনা (Edit Asset)' : 'Edit School Asset')
                  : (language === 'bn' ? 'নতুন সম্পদ / আসবাবপত্র যোগ (Add Asset)' : 'Add School Asset')}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">Item Name (সম্পদের নাম) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. হাই-বেঞ্চ ও লো-বেঞ্চ সেট (High Bench & Low Bench)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category (ক্যাটাগরি)</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Furniture">Furniture (আসবাবপত্র)</option>
                    <option value="Science Lab">Science Lab (বিজ্ঞানাগার)</option>
                    <option value="IT & Computer">IT & Computer (কম্পিউটার)</option>
                    <option value="Sports">Sports Goods (ক্রীড়া)</option>
                    <option value="Stationery">Stationery (স্টেশনারি)</option>
                    <option value="Electrical">Electrical (বৈদ্যুতিক)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Location / Room (অবস্থান)</label>
                  <input
                    type="text"
                    value={itemLocation}
                    onChange={(e) => setItemLocation(e.target.value)}
                    placeholder="e.g. Room 102 / Library"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity (পরিমাণ)</label>
                  <input
                    type="number"
                    min={1}
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit (একক)</label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="Sets / Pcs"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost (মূল্য ৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={itemCost}
                    onChange={(e) => setItemCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Condition (অবস্থা)</label>
                <select
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="Good">Good (ভালো)</option>
                  <option value="Needs Repair">Needs Repair (মেরামত প্রয়োজন)</option>
                  <option value="Damaged">Damaged (অকেজো / নষ্ট)</option>
                </select>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingItem
                    ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Update Item')
                    : (language === 'bn' ? 'সম্পদ সংরক্ষণ করুন' : 'Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'bn' ? 'সম্পদ মুছে ফেলতে চান?' : 'Delete this Asset?'}
              </h3>
              <p className="text-slate-500 mt-1">
                {language === 'bn'
                  ? `আপনি কি নিশ্চিতভাবে "${deleteConfirmItem.name}" সম্পদ তালিকা থেকে মুছে ফেলতে চান?`
                  : `Are you sure you want to permanently delete "${deleteConfirmItem.name}" from inventory?`}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-medium"
              >
                {language === 'bn' ? 'না, রাখুন' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs"
              >
                {language === 'bn' ? 'হ্যাঁ, মুছুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
