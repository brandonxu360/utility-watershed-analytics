import React, { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import "./Select.css";

export type SelectProps = {
    id?: string;
    ariaLabel?: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
};

const Select: React.FC<SelectProps> = ({ id, ariaLabel, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const selected = options.find((o) => o === value) ?? value;

    return (
        <div id={id} className="select-wrapper" ref={wrapperRef}>
            <button
                type="button"
                className="select-button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => setOpen((s) => !s)}
            >
                {selected}
                <FaChevronDown style={{ fontSize: "0.75rem", marginLeft: 6 }} />
            </button>

            {open && (
                <div role="listbox" className="select-menu" tabIndex={-1}>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            role="option"
                            aria-selected={opt === value}
                            className="select-item"
                            onClick={() => {
                                onChange(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Select;
