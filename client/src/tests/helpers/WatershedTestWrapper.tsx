/**
 * Test wrapper that provides WatershedContext to components under test.
 *
 * Usage:
 *   render(<MyComponent />, { wrapper: WatershedTestWrapper });
 *
 * Or with a custom runId:
 *   render(
 *     <WatershedTestWrapper runId="test-123">
 *       <MyComponent />
 *     </WatershedTestWrapper>
 *   );
 */

import { WatershedProvider } from "../../contexts/WatershedContext";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  runId?: string | null;
}

export function WatershedTestWrapper({
  children,
  runId = null,
}: Props): JSX.Element {
  return <WatershedProvider runId={runId}>{children}</WatershedProvider>;
}

export default WatershedTestWrapper;
