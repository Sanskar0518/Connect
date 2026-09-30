import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      redirect("/dashboard");
    }
  } catch {
    // Redirect errors thrown by Next.js are normal
  }
  redirect("/login");
}

