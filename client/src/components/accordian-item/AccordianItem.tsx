import { ReactNode, useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa6";

/**
 * Props for the drop down accordian to enforce type safety.
 */
interface AccordionItemProps {
  title: string;
  children?: ReactNode;
}

/**
 * A reusable accordion item component.
 */
export default function AccordionItem({ title, children }: AccordionItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordionItem">
      <button
        className="accordionButton"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {title}
        {open ? <FaMinus /> : <FaPlus />}
      </button>
      {open && <div className="accordionContent">{children}</div>}
    </div>
  );
}