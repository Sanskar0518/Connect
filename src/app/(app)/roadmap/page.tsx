import { Metadata } from "next";
import { RoadmapClient } from "./roadmap-client";

export const metadata: Metadata = {
  title: "AI Career Roadmap & Learning Paths | Connect",
  description:
    "Interactive adaptive learning tree and certification roadmap matched against your skills and transcript gaps.",
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
