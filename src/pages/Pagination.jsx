// src/components/ui/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/pagination.css';

function Pagination({ currentPage, totalPages, onPageChange }) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  return (
    <div className="pagination">
      <button onClick={handlePrevious} disabled={currentPage === 1} className="pagination-arrow">
        <ChevronLeft size={20} />
      </button>
      {getPageNumbers().map((number) => (
        <button key={number} onClick={() => onPageChange(number)} className={currentPage === number ? 'active' : ''}>
          {number}
        </button>
      ))}
      <button onClick={handleNext} disabled={currentPage === totalPages} className="pagination-arrow">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default Pagination;