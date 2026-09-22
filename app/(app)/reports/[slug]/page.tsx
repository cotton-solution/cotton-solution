import { Suspense } from "react";
import { notFound } from "next/navigation";
import { reportData } from "@/lib/report-data";
import { ReportViewer } from "@/components/report-viewer";

export function generateStaticParams() {
  return Object.keys(reportData).map((slug) => ({ slug }));
}

export default function ReportDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const report = reportData[params.slug];
  if (!report) notFound();
  // ReportViewer reads the popup's chosen filters off the URL
  // (useSearchParams), which Next.js requires a Suspense boundary for.
  return (
    <Suspense fallback={null}>
      <ReportViewer report={report} />
    </Suspense>
  );
}
