// src/pages/EditCity.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import '../styles/crud.css';
import '../styles/City.css';
import '../styles/Category.css'; // For image preview styles
import { getCity, updateCity } from '../api/cityApi';
// Dummy data for demonstration
const dummyCities = [
  {
    id: 23,
    name: 'Jaipur',
    slug: 'pink-city',
    image: 'https://via.placeholder.com/150/f9a8d4/8b5cf6?text=Jaipur',
    description: 'Jaipur is the capital and the largest city of the Indian state of Rajasthan. As of 2011, the city had a population of 3.1 million, making it the tenth most populous city in the country.',
    is_featured: true,
    is_active: true,
    is_deleted: false,
    created_at: '2026-06-23T13:23:02.000Z',
    updated_at: '2026-06-23T13:23:02.000Z',
  },
  {
    id: 22,
    name: 'Indore',
    slug: 'indori',
    image: 'https://via.placeholder.com/150/a5b4fc/1e3a8a?text=Indore',
    description: 'Indore is the largest and most populous city in the Indian state of Madhya Pradesh. It is a major commercial center for goods and services.',
    is_featured: true,
    is_active: true,
    is_deleted: false,
    created_at: '2026-06-22T13:06:24.000Z',
    updated_at: '2026-06-22T13:06:24.000Z',
  },
];

function EditCity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCity = async () => {
      try {
        const response = await getCity(id);
        const city = response.data.data.data;
        setFormData(city);
        setImagePreview(city.image || '');
      } catch (err) {
        setError('Unable to load city.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCity();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError('');

      const payload = new FormData();

      payload.append('name', formData.name || '');
      payload.append('slug', formData.slug || '');
      payload.append('description', formData.description || '');
      payload.append('is_featured', formData.is_featured ? 1 : 0);
      payload.append('is_active', formData.is_active ? 1 : 0);

      if (imageFile) {
        payload.append('image', imageFile);
      }

      console.log('Updating city...', id);

      const response = await updateCity(id, payload);

      console.log('Update response:', response);

      navigate('/cities');
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || 'Unable to update city'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="loading-spinner-container">Loading...</div>;
  if (error && !isSaving) return <div className="crud-page"><div className="error-message">{error}</div></div>;
  if (!formData) return <div className="crud-page"><div className="error-message">City data could not be loaded.</div></div>;

  return (
    <section className="crud-page">
      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>Edit City</h2>
        {error && <div className="error-message">{error}</div>}

        <div className="form-grid">
          <label>Name<input type="text" name="name" value={formData.name} onChange={handleChange} required /></label>
          <label>Slug<input type="text" name="slug" value={formData.slug} onChange={handleChange} required /></label>
        </div>

        <label>Description<textarea name="description" value={formData.description} onChange={handleChange} rows="3" /></label>

        <div className="form-grid" style={{ alignItems: 'center' }}>
          <label>Image<input type="file" accept="image/*" onChange={handleImageChange} /></label>
          <label className="toggle-label">Featured<label className="switch"><input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} /><span className="slider"></span></label></label>
        </div>

        {imagePreview && (
          <div className="image-preview-container">
            <p>Current Image:</p>
            <img src={imagePreview} alt="City Preview" className="category-image-preview large" />
          </div>
        )}
        {!imagePreview && (
          <div className="image-preview-container">
            <p>No Image</p>
            <div className="image-placeholder large"><ImageOff size={48} color="#9ca3af" /></div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={isSaving}>{isSaving ? 'Updating...' : 'Update City'}</button>
          <button type="button" className="secondary-button" onClick={() => navigate('/cities')}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

export default EditCity;