import { useEffect, useState } from 'react';
import { createCity, deleteCity, getCities, updateCity } from '../api/cityApi';
import '../styles/crud.css';
import CityTable from './CityTable'; // Import CityTable
import CityViewModal from './CityViewModal'; // Import CityViewModal

const emptyForm = {
  name: '',
  description: '',
};

function getListFromResponse(response) {
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

function Cities() {
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null); // State for selected city
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // State for modal visibility
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadCities = async () => {
    try {
      const response = await getCities();
      console.log('response.data.data', response.data.data)
      setCities(getListFromResponse(response.data.data));
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load cities.');
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);

    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (editingId) {
        await updateCity(editingId, formData);
        setSuccess('City updated successfully.');
      } else {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('slug', formData.slug);
        payload.append('description', formData.description);
        payload.append('is_featured', formData.is_featured ? 1 : 0);
        payload.append('is_active', formData.is_active ? 1 : 0);
        if (imageFile) {
          payload.append('image', imageFile);
        }
        await createCity(payload);
        setSuccess('City created successfully.');
      }

      resetForm();
      loadCities();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to save city.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (city) => {
    setEditingId(city.id);
    setFormData({
      name: city.name || '',
      description: city.description || '',
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this city?');

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteCity(id);
      setSuccess('City deleted successfully.');
      loadCities();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to delete city.');
    }
  };

  const handleView = (city) => {
    setSelectedCity(city);
    setIsViewModalOpen(true);
  };

  const handleStatusChange = async (id, field, value) => {
    // Placeholder for status change logic (e.g., API call to update status)
    console.log(`City ID: ${id}, Field: ${field}, New Value: ${value}`);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <section className="crud-page">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit City' : 'Create City'}</h2>

        <label>
          City Name
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>

        <label>
          Slug
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
        </label>

        <label>
          Image
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        {imagePreview && (
          <div style={{ marginTop: '15px' }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '10px',
              }}
            />
          </div>
        )}

        <div className="toggle-row">
          <label className="toggle-label">
            Featured
            <label className="switch">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_featured: e.target.checked,
                  })
                }
              />
              <span className="slider"></span>
            </label>
          </label>

          <label className="toggle-label">
            Active
            <label className="switch">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.checked,
                  })
                }
              />
              <span className="slider"></span>
            </label>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : editingId ? 'Update City' : 'Create City'}
          </button>
          {editingId && (
            <button className="secondary-button" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Use the CityTable component */}
      <CityTable
        cities={cities}
        onView={handleView}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {/* City View Modal */}
      <CityViewModal
        city={selectedCity}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </section>
  );
}

export default Cities;
