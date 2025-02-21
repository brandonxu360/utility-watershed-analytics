import { useState } from 'react';
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import { useMap } from 'react-leaflet';
import './Search.css';

/**
 * SearchControl - A custom map control component that provides location search functionality
 * 
 * @component
 */
export default function SearchControl() {
  const map = useMap();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [input, setInput] = useState('');

  const handleSearch = () => {
    const [lat, lng] = input.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 13);
      setInput('');
      setIsSearchOpen(false);
    } else {
      alert('Invalid coordinates. Please enter in "latitude, longitude" format.');
    }
  };

  return (
    <>
      <div className="leaflet-bar leaflet-control">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="search-button"
          aria-label="Search location"
          title="Search location"
        >
          {isSearchOpen ? <FaXmark className="search-icon" /> : <FaMagnifyingGlass className="search-icon" />}

        </button>

        {isSearchOpen && (
          <div className="search-modal">
            <div className="search-content">
              <div className="search-modal-field">
                <input
                  type="text"
                  name="Search bar"
                  placeholder="Search coordinates"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <div>
                <button
                  onClick={handleSearch}
                  className="search-modal-button"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}