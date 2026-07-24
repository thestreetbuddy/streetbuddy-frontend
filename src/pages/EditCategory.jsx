// src/pages/EditCategory.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategory, updateCategory } from '../api/categoryApi';
import { ImageOff } from 'lucide-react';
import '../styles/crud.css';
import '../styles/Category.css';

function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategory(id)
      .then((response) => {
        const category = response.data?.data?.data || response.data?.data || response.data;
        setFormData({ name: category.name });
        setImagePreview(category.image || '');
      })
      .catch((apiError) => {
        setError(apiError.response?.data?.message || 'Failed to load category data.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      await updateCategory(id, data);
      navigate('/categories', { state: { successMessage: 'Category updated successfully!' } });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to update category.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading-spinner-container">Loading...</div>;
  }

  if (error && !isSaving) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="crud-page">
      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>Edit Category</h2>
        {error && <div className="error-message">{error}</div>}

        <div className="form-grid">
          <label>
            Category Name
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>

          <label>
            Category Image
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </label>
        </div>

        {imagePreview && (
          <div className="image-preview-container">
            <p>Current Image:</p>
            <img src={imagePreview} alt="Category Preview" className="category-image-preview large" />
          </div>
        )}
        {!imagePreview && (
          <div className="image-preview-container">
            <p>No Image</p>
            <div className="image-placeholder large">
              <ImageOff size={48} color="#9ca3af" />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Category'}
          </button>
          <button type="button" className="secondary-button" onClick={() => navigate('/categories')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default EditCategory;