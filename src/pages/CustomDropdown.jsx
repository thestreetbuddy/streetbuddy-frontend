// src/pages/CustomDropdown.jsx
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import '../styles/CustomDropdown.css';

function CustomDropdown({ options, value, onChange, placeholder, name }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleSelect = (optionValue) => {
        // onChange({ target: { name, value: optionValue } }); // Simulate event object
        onChange({
            target: {
                name,
                value: optionValue,
            },
        });
        setIsOpen(false);
    };

    const getSelectedLabel = () => {
        const selectedOption = options.find((option) => option.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <div
                className={`custom-dropdown-header ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={!value ? 'placeholder' : ''}>{getSelectedLabel()}</span>
                <ChevronDown
                    size={20}
                    className={`dropdown-arrow ${isOpen ? 'rotate' : ''}`}
                />
            </div>

            {isOpen && (
                <ul className="custom-dropdown-menu" role="listbox">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <li
                                key={option.value}
                                className={`custom-dropdown-option ${option.value === value ? 'selected' : ''
                                    }`}
                                onClick={() => handleSelect(option.value)}
                                role="option"
                                aria-selected={option.value === value}
                            >
                                <span>{option.label}</span>
                                {option.value === value && <Check size={18} />}
                            </li>
                        ))
                    ) : (
                        <li className="custom-dropdown-option disabled">No options available</li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default CustomDropdown;