// src/pages/CityViewModal.jsx
import { ImageOff } from 'lucide-react';
import '../styles/city.css';

function CityViewModal({ city, isOpen, onClose }) {
    if (!isOpen || !city) {
        return null;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toISOString().split("T")[0];
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>View City: {city.name}</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="modal-image-container">
                        {city.image ? (
                            <img src={city.image} alt={city.name} className="modal-image" />
                        ) : (
                            <div className="modal-image-placeholder">
                                <ImageOff size={64} color="#9ca3af" />
                                <span>No Image</span>
                            </div>
                        )}
                    </div>
                    <div className="modal-details">
                        <p><strong>ID:</strong> {city.id}</p>
                        <p><strong>Name:</strong> {city.name}</p>
                        <p><strong>Slug:</strong> {city.slug}</p>
                        <div className="city-description-block">
                            <h3>Description</h3>
                            <p>{city.description || 'N/A'}</p>
                        </div>
                        <p><strong>Featured Status:</strong> {city.is_featured ? 'Featured' : 'Not Featured'}</p>
                        <p><strong>Active Status:</strong> {city.is_active ? 'Active' : 'Inactive'}</p>
                        <p><strong>Deleted Status:</strong> {city.is_deleted ? 'Deleted' : 'Not Deleted'}</p>
                        <p><strong>Created:</strong> {formatDate(city.created_at)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CityViewModal;