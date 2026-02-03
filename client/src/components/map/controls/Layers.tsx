import { useState } from "react";
import { tss } from "tss-react";
import { useTheme } from "@mui/material/styles";
import { Button, Paper, Radio, RadioGroup, FormControlLabel, Typography } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import CloseIcon from "@mui/icons-material/Close";
import type { ThemeMode } from "../../../utils/theme";

type LayersControlProps = {
  selectedLayerId: 'Satellite' | 'Topographic';
  setSelectedLayerId: (id: 'Satellite' | 'Topographic') => void;
};

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  layersButton: {
    height: 36,
    minWidth: 36,
    backgroundColor: mode.colors.primary500,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    cursor: 'pointer',
    appearance: 'none',
    borderStyle: 'outset',
    borderWidth: 2,
    borderRadius: 0,
    borderColor: '#000',
    boxSizing: 'border-box',
    '&:active': {
      borderStyle: 'inset',
    },
  },
  layersIcon: {
    fontSize: 28,
    color: mode.colors.primary100,
  },
  layersModal: {
    position: 'absolute',
    top: 0,
    right: 60,
    background: 'rgba(0, 0, 0, 0.8)',
    color: mode.colors.primary100,
    padding: `${mode.space[300]} ${mode.space[400]}`,
    borderRadius: mode.space[200],
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  layersHeading: {
    marginBottom: mode.space[200],
    fontSize: mode.fs[100],
    fontWeight: 'bold',
    color: mode.colors.primary100,
  },
  radioGroup: {
    gap: mode.space[100],
  },
  radio: {
    color: mode.colors.primary100,
    padding: mode.space[100],
    '&.Mui-checked': {
      color: mode.colors.primary100,
    },
  },
  radioLabel: {
    fontSize: mode.fs[100],
    color: mode.colors.primary100,
    marginBottom: mode.space[100],
    '& .MuiFormControlLabel-label': {
      fontSize: mode.fs[100],
    },
  },
}));

/**
 * LayersControl - A custom map control component that manages map layers
 * 
 * @component
 */
export default function LayersControl({ selectedLayerId, setSelectedLayerId }: LayersControlProps) {
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;
  const { classes } = useStyles({ mode });

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
            className={classes.radioGroup}
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
