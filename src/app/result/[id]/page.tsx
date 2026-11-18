import { ResultScreen } from "@/components/result-screen";

export function generateStaticParams() {
  return [{ id: "view" }];
}

export default function Page() {
  return <ResultScreen />;
}
