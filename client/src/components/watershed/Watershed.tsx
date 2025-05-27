import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { FaPlus, FaMinus, FaEye, FaEyeSlash } from "react-icons/fa6";
import { /*fetchSubcatchments,*/ fetchWatersheds } from "../../api/api";
import "./Watershed.css";

/** 
 * Renders the "skeleton" version of the watershed panel while loading.
 */
function SkeletonWatershedPanel() {
  return (
    <div className="skeletonPanel">
      <div className='skeletonCloseButton' />
      <div className='skeletonTitleText' />

      <div className='skeletonParagraph' />
      <div className='skeletonLine' />
      <div className='skeletonLine' />
      <div className='skeletonLine' />
      <div className='skeletonLine' />
      <div className='skeletonParagraph' />

      <div className='skeletonActions'>
        <div className='skeletonButton' />
        <div className='skeletonButton' />
        <div className='skeletonButton' />
        <div className='skeletonButton' />
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

/**
 * Props for the watershed side panel to enforce type safety.
 */
interface watershedPanelProps {
  showSubcatchments: boolean;
  setShowSubcatchments: Dispatch<SetStateAction<boolean>>;
}

/**
 * Watershed side panel that displays information related to the specified watershed,
 * including ways to run watershed models.
 * 
 * @returns {JSX.Element} - Side panel containing the specific watershed information.
 */
export default function Watershed({showSubcatchments, setShowSubcatchments}: watershedPanelProps) {
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

  if (!watershed) return <div>Watershed not found.</div>;

  const webcloudRunId = watershed?.properties?.webcloud_run_id;

  if (!webcloudRunId) return <div>Watershed</div>

  return (
    <div className="watershedPanel">
      <button
        onClick={() => navigate({ to: "/" })}
        className='closeButton'
        aria-label='Close watershed panel'
        title='Close watershed panel'
        style={{padding: '0.313rem 0.5rem'}}
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

      <div className="row">
        <p style={{marginBottom: '0'}}><strong>Watershed Models</strong></p>

        <button
          type="button"
          className={`toggleBtn ${showSubcatchments ? "active" : ""}`}
          style={{ padding: '0.313rem' }}
          aria-label={
            showSubcatchments
              ? "Hide subcatchment overlay"
              : "Show subcatchment overlay"
          }
          title={
            showSubcatchments
              ? "Hide subcatchment overlay"
              : "Show subcatchment overlay"
          }
          onClick={() => setShowSubcatchments(prev => !prev)}
        >
          <p style={{fontSize: '0.625rem', marginBottom: '0', marginRight: '0.5rem'}}>view subcatchments</p>
          {showSubcatchments ? <FaEyeSlash style={{ width: '1rem', height: '1rem' }} /> : <FaEye style={{ width: '1rem', height: '1rem' }} />}
        </button>
      </div>

      <div className='accordionGroup' key={watershedId}>
        <AccordionItem title="View Calibrated WEPP Results">
          <button className='subButton'>Spatial Outputs</button>
          <button className='subButton'>Tabular Outputs</button>
        </AccordionItem>

        <AccordionItem title="View Calibrated RHESSys Results">
          <button className='subButton'>Spatial Outputs</button>
          <button className='subButton'>Tabular Outputs</button>
        </AccordionItem>

        <AccordionItem title="View Watershed Data">
          <div className='subButton'>
            <AccordionItem title="Soil Burn Severity">
              <button className='subButton'>Firesev</button>
              <button className='subButton'>Predict</button>
              <button className='subButton'>Soil Burn Severity</button>
            </AccordionItem>
          </div>
          <button className='subButton'>Vegetation Cover</button>
          <button className='subButton'>Evapotransportation</button>
          <button className='subButton'>Soil Moisture</button>
        </AccordionItem>

        <button
          className='actionButton'
          aria-label='Run WEPP cloud watershed analysis model'
          title='Run WEPPcloud watershed analysis model'
        >
          WEPPcloud Watershed Analysis
        </button>
      </div>
    </div>
  );
}
