"use client";

import { useState } from 'react';
import { Category, useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useDeleteMultipleCategoriesMutation } from '@/state/api';
import { FaEdit, FaTrash, FaChevronUp, FaChevronDown, FaSort } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X } from 'lucide-react';

type SortConfig = {
  key: keyof Category;
  direction: 'ascending' | 'descending';
};

const ProductCategories = () => {
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteMultipleCategories] = useDeleteMultipleCategoriesMutation();

    // custom delete popup
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editMode && currentCategory) {
        await updateCategory({ 
          id: currentCategory.id, 
          categoryData: { 
            categoryName, 
            categoryCode 
          } 
        }).unwrap();
        toast.success('Category edited successfully');
      } else {
        await createCategory({ 
          categoryName, 
          categoryCode 
        }).unwrap();
        toast.success('Category created successfully');
      }
      setIsPopupOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const resetForm = () => {
    setCategoryName('');
    setCategoryCode('');
    setEditMode(false);
    setCurrentCategory(null);
  };

  const handleEdit = (category: Category) => {
    setCurrentCategory(category);
    setCategoryName(category.categoryName);
    setCategoryCode(category.categoryCode || '');
    setEditMode(true);
    setIsPopupOpen(true);
  };

  // Custome Delete Popup

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategory(categoryToDelete).unwrap();
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete Category');
    }
    
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const handleBulkDeleteClick = () => {
    if (selectedCategories.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteMultipleCategories(selectedCategories).unwrap();
      // toast.success(`${selectedCategories.length} categories deleted successfully`);
      toast.success('Categories deleted successfully');
      setSelectedCategories([]);
    } catch (error) {
      toast.error('Failed to delete categories');
    }
    setShowBulkDeleteConfirm(false);
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirm(false);
  };


  const handleDeleteSelected = () => {
    if (selectedCategories.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories(categories.map(category => category.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    if (e.target.checked) {
      setSelectedCategories([...selectedCategories, id]);
    } else {
      setSelectedCategories(selectedCategories.filter(categoryId => categoryId !== id));
    }
  };

  const requestSort = (key: keyof Category) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedCategories = [...categories];
  if (sortConfig) {
    sortedCategories.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  const getSortIcon = (key: keyof Category) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <FaChevronUp className="ml-1" /> 
      : <FaChevronDown className="ml-1" />;
  };

  return (
    <div className="p-4">
         {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">Delete Category</h3>
                    <button 
                      onClick={cancelDelete}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mb-6">Are you sure you want to delete this Category? You won't be able to revert it.</p>
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={cancelDelete}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={confirmDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
      
            {/* Bulk Delete Confirmation Popup */}
            {showBulkDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">Delete {selectedCategories.length} Categories</h3>
                    <button 
                      onClick={cancelBulkDelete}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mb-6">Are you sure you want to delete {selectedCategories.length} selected categories? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={cancelBulkDelete}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={confirmBulkDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
      <div className="flex justify-between items-center mb-4 p-4 border-b-gray-200 border-b-2">
        <h2 className="text-xl font-semibold">Categories</h2>
        <div className="flex items-center space-x-4">
          {selectedCategories.length > 0 && (
            <div className="flex items-center">
              <span className="mr-2">{selectedCategories.length} selected</span>
              <button
  onClick={handleDeleteSelected}
  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
>
  <FaTrash className="mr-1" /> Delete
</button>
            </div>
          )}
          <button
            onClick={() => {
              resetForm();
              setIsPopupOpen(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border-b">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedCategories.length === categories.length && categories.length > 0}
                />
              </th>
              <th 
                className="p-3 text-left border-b cursor-pointer"
                onClick={() => requestSort('categoryName')}
              >
                <div className="flex items-center">
                  Category Name
                  {getSortIcon('categoryName')}
                </div>
              </th>
              <th 
                className="p-3 text-left border-b cursor-pointer"
                onClick={() => requestSort('categoryCode')}
              >
                <div className="flex items-center">
                  Category Code
                  {getSortIcon('categoryCode')}
                </div>
              </th>
              <th className="p-3 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center">Loading...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-red-500">Error loading categories</td>
              </tr>
            ) : sortedCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center">No categories found</td>
              </tr>
            ) : (
              sortedCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => handleSelectCategory(e, category.id)}
                    />
                  </td>
                  <td className="p-3 border-b">{category.categoryName}</td>
                  <td className="p-3 border-b">{category.categoryCode}</td>
                  <td className="p-3 border-b">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Category Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editMode ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => {
                  setIsPopupOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Category Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Code
                </label>
                <input
                  type="text"
                  placeholder="Enter Category Code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {editMode ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCategories;