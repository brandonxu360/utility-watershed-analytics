import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { fetchWatersheds } from "../map/Map";
import { FaPlus, FaMinus } from "react-icons/fa6";
import styles from "./Watershed.module.css";

/** 
 * Renders the "skeleton" version of the watershed panel while loading.
 */
function SkeletonWatershedPanel() {
  return (
    <div className={styles.skeletonPanel}>
      <div className={styles.skeletonCloseButton} />
      <div className={styles.skeletonTitleText} />

      <div className={styles.skeletonParagraph} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonParagraph} />

      <div className={styles.skeletonActions}>
        <div className={styles.skeletonButton} />
        <div className={styles.skeletonButton} />
        <div className={styles.skeletonButton} />
        <div className={styles.skeletonButton} />
      </div>
    </div>
  );
}

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
function AccordionItem({ title, children }: AccordionItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.accordionItem}>
      <button
        className={styles.accordionButton}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {title}
        {open ? <FaMinus /> : <FaPlus />}
      </button>
      {open && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
}

/**
 * Watershed side panel that displays information related to the specified watershed,
 * including ways to run watershed models.
 * 
 * @returns {JSX.Element} - Side panel containing the specific watershed information.
 */
export default function Watershed() {
  const { watershedId } = useParams({ from: '/watershed/$watershedId' });
  const navigate = useNavigate();

  const { data: watersheds, isLoading, error } = useQuery({
    queryKey: ["watersheds"],
    queryFn: fetchWatersheds,
  });

  if (isLoading) {
    return <SkeletonWatershedPanel />;
  }

  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!watersheds?.features) return <div>No watershed data found.</div>;

  const watershed = watersheds.features.find(
    (f: any) => f.id && f.id.toString() === watershedId
  );

  if (!watershed) {
    return <div>Watershed not found.</div>;
  }

  return (
    <div className={styles.watershedPanel}>
      <button
        onClick={() => navigate({ to: "/" })}
        className={styles.closeButton}
        aria-label={'Close watershed panel'}
        title={'Close watershed panel'}
      >
        BACK
      </button>
      <h2>{watershed.properties.pws_name}</h2>
      <p>This is where the description for the watershed will go. For now we have placeholder text.</p>
      <p>
        <strong>Number of Customers:</strong>{" "}
        {watershed.properties.num_customers ?? "N/A"}
      </p>
      <p>
        <strong>Source Type:</strong> {watershed.properties.source_type ?? "N/A"}
      </p>
      <p>
        <strong>County:</strong> {watershed.properties.cnty_name ?? "N/A"}
      </p>
      <p>
        <strong>Acres:</strong> {watershed.properties.acres ?? "N/A"}
      </p>

      <div className={styles.accordionGroup}>
        <AccordionItem title="View Calibrated WEPP Results">
          <button className={styles.subButton}>Spatial Outputs</button>
          <button className={styles.subButton}>Tabular Outputs</button>
        </AccordionItem>

        <AccordionItem title="View Calibrated RHESSys Results">
          <button className={styles.subButton}>Spatial Outputs</button>
          <button className={styles.subButton}>Tabular Outputs</button>
        </AccordionItem>

        <AccordionItem title="View Watershed Data">
          <AccordionItem title="Soil Burn Severity">
            <button className={styles.subButton}>Firesev</button>
            <button className={styles.subButton}>Predict</button>
            <button className={styles.subButton}>Soil Burn Severity</button>
          </AccordionItem>
          <button className={styles.subButton}>Vegetation Cover</button>
          <button className={styles.subButton}>Evapotransportation</button>
          <button className={styles.subButton}>Soil Moisture</button>
        </AccordionItem>

        <button
          className={styles.actionButton}
          aria-label={'Run WEPP cloud watershed analysis model'}
          title={'Run WEPPcloud watershed analysis model'}
        >
          WEPPcloud Watershed Analysis
        </button>
      </div>
    </div>
  );
}