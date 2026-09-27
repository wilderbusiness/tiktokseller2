import { Desk } from "@/app/_components/desk";
import { connectionStatus } from "@/lib/keel/env";

export default function Page() {
  return <Desk connections={connectionStatus()} />;
}
