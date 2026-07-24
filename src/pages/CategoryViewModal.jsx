// src/components/categories/CategoryViewModal.jsx
import { ImageOff } from 'lucide-react';
import "./Modal.css";

function CategoryViewModal({ category, isOpen, onClose }) {
  if (!isOpen || !category) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>View Category: {category.name}</h2>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="modal-image-container">
            {category.image ? (
              <img src={category.image} alt={category.name} className="modal-image" />
            ) : (
              <div className="modal-image-placeholder">
                <ImageOff size={64} color="#9ca3af" />
                <span>No Image</span>
              </div>
            )}
          </div>
          <div className="modal-details">
            <p><strong>ID:</strong> {category.id}</p>
            <p><strong>Name:</strong> {category.name}</p>
            <p><strong>Active:</strong> {category.is_active ? 'Yes' : 'No'}</p>
            <p><strong>Deleted:</strong> {category.deleted_at ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryViewModal;