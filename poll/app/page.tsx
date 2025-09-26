import { redirect } from "next/navigation";

export default async function Page() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  // If a base path is defined (e.g. "/tierlist" in production), redirect to it
  // Otherwise, default to the tierlist route in dev
  redirect(base || "/tierlist");
}



