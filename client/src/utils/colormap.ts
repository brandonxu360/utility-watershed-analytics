/**
 * Colormap utility for choropleth rendering and legend generation.
 * Based on Ben Postlethwaite's implementation (MIT License, January 2013).
 * Adapted for TypeScript and React/Leaflet applications.
 */

export type ColorStop = {
    index: number;
    rgb: [number, number, number] | [number, number, number, number];
};

export type ColorScaleDefinition = ColorStop[];

export type ColormapFormat = 'hex' | 'rgbaString' | 'float' | 'rgba';

export type ColormapSpec = {
    colormap?: string | ColorScaleDefinition;
    nshades?: number;
    format?: ColormapFormat;
    alpha?: number | [number, number];
};

export type ColorArray = string[] & {
    map: (v: number) => string;
};

export type RGBAArray = [number, number, number, number][] & {
    map: (v: number) => [number, number, number, number];
};

/**
 * Built-in color scales for scientific visualization
 */
export const COLOR_SCALES: Record<string, ColorScaleDefinition> = {
    jet: [
        { index: 0, rgb: [0, 0, 131] },
        { index: 0.125, rgb: [0, 60, 170] },
        { index: 0.375, rgb: [5, 255, 255] },
        { index: 0.625, rgb: [255, 255, 0] },
        { index: 0.875, rgb: [250, 0, 0] },
        { index: 1, rgb: [128, 0, 0] },
    ],
    jet2: [
        { index: 0.0, rgb: [5, 255, 255] },
        { index: 0.4, rgb: [255, 255, 0] },
        { index: 0.8, rgb: [250, 0, 0] },
        { index: 1, rgb: [128, 0, 0] },
    ],
    viridis: [
        { index: 0, rgb: [68, 1, 84] },
        { index: 0.13, rgb: [71, 44, 122] },
        { index: 0.25, rgb: [59, 81, 139] },
        { index: 0.38, rgb: [44, 113, 142] },
        { index: 0.5, rgb: [33, 144, 141] },
        { index: 0.63, rgb: [39, 173, 129] },
        { index: 0.75, rgb: [92, 200, 99] },
        { index: 0.88, rgb: [170, 220, 50] },
        { index: 1, rgb: [253, 231, 37] },
    ],
    inferno: [
        { index: 0, rgb: [0, 0, 4] },
        { index: 0.13, rgb: [31, 12, 72] },
        { index: 0.25, rgb: [85, 15, 109] },
        { index: 0.38, rgb: [136, 34, 106] },
        { index: 0.5, rgb: [186, 54, 85] },
        { index: 0.63, rgb: [227, 89, 51] },
        { index: 0.75, rgb: [249, 140, 10] },
        { index: 0.88, rgb: [249, 201, 50] },
        { index: 1, rgb: [252, 255, 164] },
    ],
    plasma: [
        { index: 0, rgb: [13, 8, 135] },
        { index: 0.13, rgb: [75, 3, 161] },
        { index: 0.25, rgb: [125, 3, 168] },
        { index: 0.38, rgb: [168, 34, 150] },
        { index: 0.5, rgb: [203, 70, 121] },
        { index: 0.63, rgb: [229, 107, 93] },
        { index: 0.75, rgb: [248, 148, 65] },
        { index: 0.88, rgb: [253, 195, 40] },
        { index: 1, rgb: [240, 249, 33] },
    ],
    winter: [
        { index: 0, rgb: [0, 0, 255] },
        { index: 1, rgb: [0, 255, 128] },
    ],
    greens: [
        { index: 0, rgb: [0, 68, 27] },
        { index: 0.125, rgb: [0, 109, 44] },
        { index: 0.25, rgb: [35, 139, 69] },
        { index: 0.375, rgb: [65, 171, 93] },
        { index: 0.5, rgb: [116, 196, 118] },
        { index: 0.625, rgb: [161, 217, 155] },
        { index: 0.75, rgb: [199, 233, 192] },
        { index: 0.875, rgb: [229, 245, 224] },
        { index: 1, rgb: [247, 252, 245] },
    ],
    rdbu: [
        { index: 0, rgb: [5, 10, 172] },
        { index: 0.35, rgb: [106, 137, 247] },
        { index: 0.5, rgb: [190, 190, 190] },
        { index: 0.6, rgb: [220, 170, 132] },
        { index: 0.7, rgb: [230, 145, 90] },
        { index: 1, rgb: [178, 10, 28] },
    ],
    hot: [
        { index: 0, rgb: [0, 0, 0] },
        { index: 0.3, rgb: [230, 0, 0] },
        { index: 0.6, rgb: [255, 210, 0] },
        { index: 1, rgb: [255, 255, 255] },
    ],
    cool: [
        { index: 0, rgb: [0, 255, 255] },
        { index: 1, rgb: [255, 0, 255] },
    ],
    rainbow: [
        { index: 0, rgb: [150, 0, 90] },
        { index: 0.125, rgb: [0, 0, 200] },
        { index: 0.25, rgb: [0, 25, 255] },
        { index: 0.375, rgb: [0, 152, 255] },
        { index: 0.5, rgb: [44, 255, 150] },
        { index: 0.625, rgb: [151, 255, 0] },
        { index: 0.75, rgb: [255, 234, 0] },
        { index: 0.875, rgb: [255, 111, 0] },
        { index: 1, rgb: [255, 0, 0] },
    ],
    greys: [
        { index: 0, rgb: [0, 0, 0] },
        { index: 1, rgb: [255, 255, 255] },
    ],
    bluered: [
        { index: 0, rgb: [0, 0, 255] },
        { index: 1, rgb: [255, 0, 0] },
    ],
    // ET-specific: brown to green (low to high evapotranspiration)
    'et-green': [
        { index: 0, rgb: [139, 90, 43] },      // Brown (low ET)
        { index: 0.25, rgb: [210, 180, 140] }, // Tan
        { index: 0.5, rgb: [255, 255, 200] },  // Light yellow
        { index: 0.75, rgb: [144, 238, 144] }, // Light green
        { index: 1, rgb: [34, 139, 34] },      // Forest green (high ET)
    ],
    // ET alternative: blue scale for water-related measures
    'et-blue': [
        { index: 0, rgb: [255, 247, 236] },    // Light cream
        { index: 0.25, rgb: [254, 232, 200] }, // Peach
        { index: 0.5, rgb: [127, 205, 187] },  // Teal
        { index: 0.75, rgb: [65, 182, 196] },  // Cyan
        { index: 1, rgb: [8, 104, 172] },      // Deep blue
    ],
};

/**
 * Clamp a value to the 0-1 range
 */
function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

/**
 * Linear interpolation between two values
 */
function lerp(v0: number, v1: number, t: number): number {
    return v0 * (1 - t) + v1 * t;
}

/**
 * Convert RGBA array to hex string
 */
function rgba2hex(rgba: number[]): string {
    let hex = '#';
    for (let i = 0; i < 3; i++) {
        const component = Math.round(rgba[i]).toString(16);
        hex += ('00' + component).slice(-2);
    }
    return hex;
}

/**
 * Convert RGBA array to CSS rgba() string
 */
function rgba2str(rgba: number[]): string {
    return `rgba(${Math.round(rgba[0])},${Math.round(rgba[1])},${Math.round(rgba[2])},${rgba[3]})`;
}

/**
 * Convert RGBA array to normalized float array (0-1)
 */
function rgba2float(rgba: number[]): [number, number, number, number] {
    return [rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3]];
}

/**
 * Creates a colormap lookup array with a convenient .map() method for
 * mapping normalized values (0-1) to colors.
 * 
 * @param spec - Configuration options for the colormap
 * @returns Array of colors with attached .map(v) method
 * 
 * @example
 * // Create a 64-shade viridis mapper
 * const cmap = createColormap({ colormap: 'viridis', nshades: 64 });
 * const color = cmap.map(0.5);  // Returns hex color at 50%
 * 
 * @example
 * // Create with custom alpha
 * const cmap = createColormap({ colormap: 'viridis', alpha: 0.8 });
 */
export function createColormap(spec: ColormapSpec = {}): ColorArray | RGBAArray {
    const nshades = (spec.nshades ?? 256) - 1;
    const format = spec.format ?? 'hex';
    const colormapName = spec.colormap ?? 'viridis';

    let cmap: ColorScaleDefinition;

    if (typeof colormapName === 'string') {
        const normalizedName = colormapName.toLowerCase();
        if (!COLOR_SCALES[normalizedName]) {
            throw new Error(`${colormapName} is not a supported colorscale`);
        }
        cmap = COLOR_SCALES[normalizedName];
    } else if (Array.isArray(colormapName)) {
        cmap = colormapName;
    } else {
        throw new Error('Unsupported colormap option');
    }

    if (cmap.length > nshades + 1) {
        throw new Error(`Colormap requires nshades to be at least ${cmap.length}`);
    }

    // Handle alpha configuration
    let alpha: [number, number];
    if (Array.isArray(spec.alpha) && spec.alpha.length === 2) {
        alpha = [clamp01(spec.alpha[0]), clamp01(spec.alpha[1])];
    } else if (typeof spec.alpha === 'number') {
        const a = clamp01(spec.alpha);
        alpha = [a, a];
    } else {
        alpha = [1, 1];
    }

    // Map index points from 0..1 to 0..nshades
    const indices = cmap.map((c) => Math.round(c.index * nshades));

    // Build steps with alpha interpolation
    const steps = cmap.map((c) => {
        const rgba = [...c.rgb];
        // If user supplies their own alpha in rgb array, use it
        if (rgba.length === 4 && rgba[3] >= 0 && rgba[3] <= 1) {
            return rgba as [number, number, number, number];
        }
        // Otherwise interpolate alpha based on position
        rgba[3] = alpha[0] + (alpha[1] - alpha[0]) * c.index;
        return rgba as [number, number, number, number];
    });

    // Interpolate colors between control points
    const colors: [number, number, number, number][] = [];
    for (let i = 0; i < indices.length - 1; i++) {
        const nsteps = indices[i + 1] - indices[i];
        const fromRgba = steps[i];
        const toRgba = steps[i + 1];

        for (let j = 0; j < nsteps; j++) {
            const amt = j / nsteps;
            colors.push([
                Math.round(lerp(fromRgba[0], toRgba[0], amt)),
                Math.round(lerp(fromRgba[1], toRgba[1], amt)),
                Math.round(lerp(fromRgba[2], toRgba[2], amt)),
                lerp(fromRgba[3], toRgba[3], amt),
            ]);
        }
    }

    // Add final color
    const lastColor = cmap[cmap.length - 1].rgb;
    colors.push([lastColor[0], lastColor[1], lastColor[2], alpha[1]]);

    // Convert to requested format
    let result: string[] | [number, number, number, number][];
    switch (format) {
        case 'hex':
            result = colors.map(rgba2hex);
            break;
        case 'rgbaString':
            result = colors.map(rgba2str);
            break;
        case 'float':
            result = colors.map(rgba2float);
            break;
        case 'rgba':
            result = colors;
            break;
        default:
            result = colors.map(rgba2hex);
    }

    // Attach the .map() method for value lookup
    const colorArray = result as ColorArray | RGBAArray;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (colorArray as any).map = function (this: typeof result, v: number) {
        const idx = Math.floor((this.length - 1) * clamp01(v));
        return this[idx];
    };

    return colorArray;
}

/**
 * Get a color from a colormap for a given normalized value
 * Convenience function that creates a colormap and maps a single value
 * 
 * @param value - Normalized value (0-1)
 * @param colormap - Name of the colormap
 * @param format - Output format
 * @returns Color in the specified format
 */
export function getColor(
    value: number,
    colormap: string = 'viridis',
    format: ColormapFormat = 'hex'
): string | [number, number, number, number] {
    const cmap = createColormap({ colormap, format, nshades: 256 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (cmap as any).map(value);
}

/**
 * Normalize a value to 0-1 range given min/max bounds
 */
export function normalizeValue(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return clamp01((value - min) / (max - min));
}

/**
 * Compute robust min/max range using percentiles to avoid outlier domination
 */
export function computeRobustRange(
    values: number[],
    percentileLow: number = 0.05,
    percentileHigh: number = 0.95
): { min: number; max: number } {
    if (values.length === 0) return { min: 0, max: 1 };

    const sorted = [...values].sort((a, b) => a - b);
    const lowIdx = Math.floor(sorted.length * percentileLow);
    const highIdx = Math.floor(sorted.length * percentileHigh);

    return {
        min: sorted[lowIdx] ?? sorted[0],
        max: sorted[highIdx] ?? sorted[sorted.length - 1],
    };
}

export default createColormap;
