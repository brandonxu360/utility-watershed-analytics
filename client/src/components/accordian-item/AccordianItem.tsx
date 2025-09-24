import { ReactNode, useState } from "react";
import { FaChevronUp, FaChevronDown } from "react-icons/fa6";

type AccordionItemProps = {
  title: string;
  children?: ReactNode;
}

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
        {open ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {open && <div className="accordionContent">{children}</div>}
    </div>
  );
}
