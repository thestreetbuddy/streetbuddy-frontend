// src/pages/CityTable.jsx
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Edit, ImageOff } from 'lucide-react';
import '../styles/City.css';
import '../styles/Category.css'; // Reusing toggle switch styles

function CityTable({ cities, onStatusChange, onDelete, onView }) {
  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate(`/cities/edit/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const truncateDescription = (text = '') => {
    if (!text) return '';
    if (text.length <= 60) return text;
    return text.substring(0, 60) + '...';
  };

  const sortedCities = [...cities].sort((a, b) => b.id - a.id);

  return (
    <div className="table-card">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Featured</th>
              <th>Active</th>
              <th>Deleted</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCities.length > 0 ? (
              sortedCities.map((city) => (
                <tr key={city.id}>
                  <td className="city-id">{city.id}</td>
                  <td>
                    {city.image ? (
                      <img src={city.image} alt={city.name} className="table-image-thumbnail" />
                    ) : (
                      <div className="table-image-placeholder">
                        <ImageOff size={24} />
                      </div>
                    )}
                  </td>
                  <td className="city-name">{city.name}</td>
                  <td>{city.slug}</td>
                  <td title={city.description}>{truncateDescription(city.description)}</td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!city.is_featured}
                        onChange={(e) => onStatusChange(city.id, 'is_featured', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!city.is_active}
                        onChange={(e) => onStatusChange(city.id, 'is_active', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!city.is_deleted}
                        onChange={(e) => onStatusChange(city.id, 'is_deleted', e.target.checked)}
                        className="deleted-toggle"
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>{formatDate(city.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => onView(city)} aria-label="View">
                        <Eye size={18} />
                      </button>
                      <button className="icon-button" onClick={() => handleEdit(city.id)} aria-label="Edit">
                        <Edit size={18} />
                      </button>
                      <button className="icon-button danger-button" onClick={() => onDelete(city.id)} aria-label="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="empty-table">No cities found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CityTable;