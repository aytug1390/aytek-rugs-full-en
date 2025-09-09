import { Suspense } from "react";
import PageClient from "./PageClient";

export const dynamic = "force-dynamic"; // opsiyonel ama build’ı rahatlatır

export default function PageWrapper(props: any) {
  return (
    <Suspense fallback={null}>
      <PageClient {...props} />
    </Suspense>
  );
}
