/// <reference types="vite/client" />

declare module "georaster" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseGeoRaster: (input: ArrayBuffer) => Promise<any>;
  export default parseGeoRaster;
}

declare module "georaster-layer-for-leaflet" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GeoRasterLayer: any;
  export default GeoRasterLayer;
}
