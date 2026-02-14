import { FC } from 'react';
import { ChangeEvent } from 'react';
import { VegetationCover } from '../../../bottom-panels/VegetationCover';
import { useChoropleth } from '../../../../hooks/useChoropleth';
import { useAppStore } from '../../../../store/store';
import { tss } from '../../../../utils/tss';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';

const useStyles = tss.create(({ theme }) => ({
    layers: {
        maxHeight: '120px',
        overflowY: 'auto',
        padding: `${theme.spacing(0.5)} 0 ${theme.spacing(1)} 0`,
    },
    layer: {
        display: 'flex',
        alignItems: 'center',
        padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
    },
    layerTitle: {
        fontSize: theme.typography.subtitle2.fontSize,
        color: theme.palette.primary.dark,
        fontWeight: 500,
        cursor: 'pointer',
        flex: 1,
        textAlign: 'left',
        textTransform: 'none',
        justifyContent: 'flex-start',
        background: 'none',
    },
    layerCheckbox: {
        marginLeft: theme.spacing(1),
        color: theme.palette.primary.dark,
    },
    helpIcon: {
        color: theme.palette.accent.main,
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
}));

type DataLayersTabContentProps = {
    activeTab: string;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const DataLayersTabContent: FC<DataLayersTabContentProps> = ({
    activeTab,
    handleChange,
}) => {
    const { classes } = useStyles();

    const {
        subcatchment,
        channels,
        landuse,
        choropleth: { type: choroplethType },
        setSubcatchment,
        setChoroplethType,
        openPanel,
    } = useAppStore();

    const { isActive } = useChoropleth();

    return (
        <div className={classes.layers}>
            {activeTab === 'WEPP Hillslopes' && (
                <>
                    <div className={classes.layer}>
                        <Button className={classes.layerTitle}>Subcatchments</Button>
                        <Checkbox
                            checked={subcatchment}
                            onChange={handleChange}
                            disabled={landuse && subcatchment}
                            className={classes.layerCheckbox}
                            slotProps={{ input: { id: "subcatchment" } }}
                        />
                    </div>
                    <div className={classes.layer}>
                        <Button className={classes.layerTitle}>WEPP Channels</Button>
                        <Checkbox
                            checked={channels}
                            onChange={handleChange}
                            className={classes.layerCheckbox}
                            slotProps={{ input: { id: "channels" } }}
                        />
                    </div>
                </>
            )}
            {activeTab === 'Surface Data' && (
                <>
                    <div className={classes.layer}>
                        <Button className={classes.layerTitle}>Land Use (2025)</Button>
                        <Checkbox
                            checked={landuse}
                            onChange={handleChange}
                            className={classes.layerCheckbox}
                            slotProps={{ input: { id: "landuse" } }}
                        />
                    </div>
                    <div className={classes.layer}>
                        <Button
                            className={classes.layerTitle}
                            onClick={() => { }}
                            style={{ fontWeight: isActive && choroplethType === 'evapotranspiration' ? 'bold' : 'normal' }}
                        >
                            Evapotranspiration
                        </Button>
                    </div>
                </>
            )}
            {activeTab === 'Coverage' && (
                <>
                    <div className={classes.layer}>
                        <Button className={classes.layerTitle} onClick={
                            () => {
                                setSubcatchment(true);
                                setChoroplethType('vegetationCover');
                                openPanel(<VegetationCover />);
                            }
                        }>
                            Vegetation Cover
                        </Button>
                    </div>
                </>
            )}
            {activeTab === 'Soil Burn' && (
                <>
                    <div className={classes.layer}>
                        <Button className={classes.layerTitle}>Fire Severity</Button>
                        <Checkbox
                            onChange={handleChange}
                            className={classes.layerCheckbox}
                            slotProps={{ input: { id: "fireSeverity" } }}
                        />
                    </div>
                    <div className={classes.layer}>
                        <Button className={classes.layerTitle}>Soil Burn Severity</Button>
                        <Checkbox
                            onChange={handleChange}
                            className={classes.layerCheckbox}
                            slotProps={{ input: { id: "soilBurnSeverity" } }}
                        />
                    </div>
                    <div className={classes.layer}>
                        <Button className={classes.layerTitle}>Predict</Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default DataLayersTabContent;
