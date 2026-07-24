// src/pages/Categories.jsx

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
// CORRECT
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategoryStatus,
} from "../api/categoryApi";

import CategoryTable from "./CategoryTable";
import CategoryViewModal from "./CategoryViewModal";
// import Toast from '../components/ui/Toast';
import '../styles/crud.css';
// import Pagination from '../components/ui/Pagination';

const emptyForm = {
  name: '',
  icon: '',
};

function getListFromResponse(response) {
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data.data)) {
    return response.data.data;
  }

  if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
    return response.data.data.data;
  }

  return [];
}

function Categories() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(getListFromResponse(response));
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load categories.');
    }
  };

  useEffect(() => {
    if (location.state?.successMessage) {
      setToast({ message: location.state.successMessage, type: 'success', id: Date.now() });
      window.history.replaceState({}, document.title); // Clear state
    }
    loadCategories();
  }, []);

  useEffect(() => {
    setTotalPages(Math.ceil(categories.length / itemsPerPage));
  }, [categories]);
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await createCategory(formData);
      setToast({ message: 'Category created successfully.', type: 'success', id: Date.now() });

      resetForm();
      loadCategories();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this category?');

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteCategory(id);
      setToast({ message: 'Category deleted successfully.', type: 'success', id: Date.now() });
      loadCategories();
    } catch (apiError) {
      setToast({ message: apiError.response?.data?.message || 'Unable to delete category.', type: 'error', id: Date.now() });
    }
  };

  const handleStatusChange = async (id, field, value) => {
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat))
    );

    try {
      await updateCategoryStatus(id, { [field]: value });
      setToast({ message: 'Status updated.', type: 'success', id: Date.now() });
    } catch (apiError) {
      setToast({ message: 'Failed to update status.', type: 'error', id: Date.now() });
      // Revert UI on error
      loadCategories();
    }
  };

  const paginatedCategories = categories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section className="crud-page">
      {/* {toast.message && <Toast key={toast.id} message={toast.message} type={toast.type} onDone={() => setToast({ message: '', type: '' })} />} */}
      {error && <div className="error-message">{error}</div>}

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>Create Category</h2>
        <div className="form-grid">
          <label>
            Category Name
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </label>
          <label>
            Icon/Image
            <input
              type="file"
              name="icon"
              // This needs a proper handler if you intend to upload files
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Create Category'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="loading-spinner-container">Loading categories...</div>
      ) : (
        <CategoryTable
          categories={paginatedCategories}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onView={setViewingCategory}
        />
      )}

      {/* {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )} */}

      <CategoryViewModal
        category={viewingCategory}
        isOpen={!!viewingCategory}
        onClose={() => setViewingCategory(null)}
      />
    </section>
  );
}

export default Categories;
