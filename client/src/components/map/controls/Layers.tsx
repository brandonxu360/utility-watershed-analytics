import { useState } from "react";
import { tss } from "../../../utils/tss";
import { Button, Paper, Radio, RadioGroup, FormControlLabel, Typography } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import CloseIcon from "@mui/icons-material/Close";

type LayersControlProps = {
  selectedLayerId: 'Satellite' | 'Topographic';
  setSelectedLayerId: (id: 'Satellite' | 'Topographic') => void;
};

const useStyles = tss.create(({ theme }) => ({
  layersButton: {
    height: 36,
    minWidth: 36,
    backgroundColor: theme.palette.primary.dark,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    cursor: 'pointer',
    appearance: 'none',
    borderStyle: 'outset',
    borderWidth: 2,
    borderRadius: 0,
    borderColor: theme.palette.surface.border,
    boxSizing: 'border-box',
    '&:active': {
      borderStyle: 'inset',
    },
  },
  layersIcon: {
    fontSize: 28,
    color: theme.palette.primary.contrastText,
  },
  layersModal: {
    position: 'absolute',
    top: 0,
    right: 60,
    background: theme.palette.surface.overlay,
    color: theme.palette.primary.contrastText,
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderRadius: theme.spacing(1),
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  layersHeading: {
    marginBottom: theme.spacing(1),
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 'bold',
    color: theme.palette.primary.contrastText,
  },
  radio: {
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1),
    '&.Mui-checked': {
      color: theme.palette.primary.contrastText,
    },
  },
  radioLabel: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.primary.contrastText,
    marginBottom: theme.spacing(1),
    '& .MuiFormControlLabel-label': {
      fontSize: theme.typography.body2.fontSize,
    },
  },
}));

/**
 * LayersControl - A custom map control component that manages map layers
 * 
 * @component
 */
export default function LayersControl({ selectedLayerId, setSelectedLayerId }: LayersControlProps) {
  const { classes } = useStyles();

  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const layers = [
    { id: 'Satellite', name: 'Satellite' },
    { id: 'Topographic', name: 'Topographic' }
  ];

  const toggleLayers = () => setIsLayersOpen((prev) => !prev);

  return (
    <div className="leaflet-bar leaflet-control">
      <Button
        onClick={toggleLayers}
        className={classes.layersButton}
        aria-label={isLayersOpen ? 'Close layers' : 'Open layers'}
        title={isLayersOpen ? 'Close layers' : 'Open layers'}
      >
        {isLayersOpen ? (
          <CloseIcon className={classes.layersIcon} />
        ) : (
          <LayersIcon className={classes.layersIcon} />
        )}
      </Button>

      {isLayersOpen && (
        <Paper className={classes.layersModal}>
          <Typography className={classes.layersHeading}>Map Layer</Typography>
          <RadioGroup
            value={selectedLayerId}
            onChange={(e) => setSelectedLayerId(e.target.value as LayersControlProps['selectedLayerId'])}
          >
            {layers.map((layer) => (
              <FormControlLabel
                key={layer.id}
                value={layer.id}
                control={
                  <Radio
                    size="small"
                    className={classes.radio}
                  />
                }
                label={layer.name}
                className={classes.radioLabel}
              />
            ))}
          </RadioGroup>
        </Paper>
      )}
    </div>
  );
}
