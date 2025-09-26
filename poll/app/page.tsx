import { redirect } from "next/navigation";

export default async function Page() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  redirect(`${base || ""}/tierlist`);
}



