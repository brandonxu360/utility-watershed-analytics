import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FaUpRightAndDownLeftFromCenter, FaDownLeftAndUpRightToCenter } from "react-icons/fa6";

export default function ExpandControl({ setIsSideContentOpen }: { setIsSideContentOpen: (open: boolean) => void }) {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      containerRef.current = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      containerRef.current.style.backgroundColor = '#121212';
      containerRef.current.style.width = '40px';
      containerRef.current.style.height = '40px';
      containerRef.current.style.display = 'flex';
      containerRef.current.style.justifyContent = 'center';
      containerRef.current.style.alignItems = 'center';
      containerRef.current.style.cursor = 'pointer';

      const ExpandControl = L.Control.extend({
        onAdd: function () {
          containerRef.current!.addEventListener('click', () => {
            setIsOpen((prev) => !prev);
          });
          return containerRef.current!;
        }
      });

      const control = new ExpandControl({ position: 'bottomright' });
      map.addControl(control);
      rootRef.current = createRoot(containerRef.current!);
    }
  }, [map]);

  // Effect to sync state safely
  useEffect(() => {
    setIsSideContentOpen(isOpen);
  }, [isOpen, setIsSideContentOpen]);

  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.render(
        isOpen ? (
          <FaDownLeftAndUpRightToCenter style={{ fontSize: '20px', color: 'white', cursor: 'pointer' }} />
        ) : (
          <FaUpRightAndDownLeftFromCenter style={{ fontSize: '20px', color: 'white', cursor: 'pointer' }} />
        )
      );
    }
  }, [isOpen]);

  return null;
}