import { ReactNode } from 'react';
import { useMatch } from '@tanstack/react-router';
import { WatershedIDContext } from './WatershedIDContext';

import {
  watershedOverviewRoute,
  watershedDataRoute,
} from '../../routes/router';

export function WatershedIDProvider({ children }: { children: ReactNode }) {
  const overviewMatch = useMatch({ 
    from : watershedOverviewRoute.id,
    shouldThrow: false,
  });

  const dataMatch = useMatch({
    from: watershedDataRoute.id,
    shouldThrow: false,
  });

  const watershedId =
    overviewMatch?.params.webcloudRunId ??
    dataMatch?.params.webcloudRunId ??
    null;

  return (
    <WatershedIDContext.Provider value={watershedId}>
      {children}
    </WatershedIDContext.Provider>
  );
}
