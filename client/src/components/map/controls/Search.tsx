import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

export default function SearchControl() {
  const map = useMap(); // Gets the map that we're using
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Defines the state of the search modal
  const [input, setInput] = useState(''); // State for the input field
  const containerRef = useRef<HTMLDivElement | null>(null); // Ref for the control container
  const rootRef = useRef<Root | null>(null); // Store the root instance

  useEffect(() => {
    // Create the control only once
    if (!containerRef.current) {
      containerRef.current = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

      const searchControl = L.Control.extend({
        onAdd: function () {
          // Container element
          containerRef.current!.style.backgroundColor = '#121212';
          containerRef.current!.style.width = '40px';
          containerRef.current!.style.height = '40px';
          containerRef.current!.style.display = 'flex';
          containerRef.current!.style.justifyContent = 'center';
          containerRef.current!.style.alignItems = 'center';
          containerRef.current!.style.cursor = 'pointer';

          // Click handler
          containerRef.current!.addEventListener('click', () => {
            setIsSearchOpen((prev) => !prev);
          });

          return containerRef.current!;
        }
      });

      const control = new searchControl({ position: 'topright' });
      map.addControl(control);
      rootRef.current = createRoot(containerRef.current!);
    }

    if (rootRef.current) {
      rootRef.current.render(
        isSearchOpen ? (
          <>
            <FaXmark style={{ fontSize: '20px', color: 'white', margin: 'auto', cursor: 'pointer' }} />
          </>
        ) : (
          <FaMagnifyingGlass style={{ fontSize: '20px', color: 'white', cursor: 'pointer' }} />
        )
      );
    }
  }, [isSearchOpen, map]);

  return isSearchOpen ? (
    <div className='search-modal'>
      <div className='search-content'>
        <div className='search-modal-field'>
          <input
            type="text"
            name='Search bar'
            placeholder="Search coordinates"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <button
            onClick={() => {
              const [lat, lng] = input.split(',').map(coord => parseFloat(coord.trim()));
              if (!isNaN(lat) && !isNaN(lng)) {
                map.setView([lat, lng], 13);
                setInput('');
                setIsSearchOpen(false);
              } else {
                alert('Invalid coordinates. Please enter in "latitude, longitude" format.');
              }
            }}
            className='search-modal-button'
          >
            Go
          </button>
        </div>
      </div>
    </div>
  ) : null;
}