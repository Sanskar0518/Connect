import { Metadata } from "next";
import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Talent Profile & Skill Intelligence | Connect",
  description:
    "Upload academic transcripts, identify skill gaps, and benchmark against top company requirements.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
