import { notFound } from "next/navigation";
import SorobanDemo from "./SorobanDemo";

export default function SorobanDevPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <SorobanDemo />;
}
