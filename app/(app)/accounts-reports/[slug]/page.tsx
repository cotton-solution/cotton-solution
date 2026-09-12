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
  return <ReportViewer report={report} />;
}
