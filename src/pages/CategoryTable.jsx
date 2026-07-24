// src/components/categories/CategoryTable.jsx
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Edit, ImageOff } from 'lucide-react';
import '../styles/Category.css';

function CategoryTable({ categories, onStatusChange, onDelete, onView }) {
  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate(`/categories/edit/${id}`);
  };

  const sortedCategories = [...categories].sort((a, b) => b.id - a.id);

  return (
    <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Active</th>
              <th>Disabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.length > 0 ? (
              sortedCategories.map((category) => (
                <tr key={category.id}>
                  <td className="category-id">{category.id}</td>
                  <td>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="table-image-thumbnail"
                      />
                    ) : (
                      <div className="table-image-placeholder">
                        <ImageOff size={24} />
                      </div>
                    )}
                  </td>
                  <td className="category-name">{category.name}</td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!category.is_active}
                        onChange={(e) => onStatusChange(category.id, 'is_active', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!category.deleted_at}
                        onChange={(e) => onStatusChange(category.id, 'deleted_at', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => onView(category)} aria-label="View">
                        <Eye size={18} />
                      </button>
                      <button className="icon-button" onClick={() => handleEdit(category.id)} aria-label="Edit">
                        <Edit size={18} />
                      </button>
                      <button className="icon-button danger-button" onClick={() => onDelete(category.id)} aria-label="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-table">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
    </div>
  );
}

export default CategoryTable;