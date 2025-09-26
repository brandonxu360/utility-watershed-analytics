import { ReactNode } from 'react';
import { useMatch } from '@tanstack/react-router';
import { WatershedIDContext } from './WatershedIDContext';

import {
  watershedOverviewRoute,
} from '../../routes/router';

export function WatershedIDProvider({ children }: { children: ReactNode }) {
  const overviewMatch = useMatch({ 
    from : watershedOverviewRoute.id,
    shouldThrow: false,
  });

  const watershedId =
    overviewMatch?.params.webcloudRunId ??
    null;

  return (
    <WatershedIDContext.Provider value={watershedId}>
      {children}
    </WatershedIDContext.Provider>
  );
}
