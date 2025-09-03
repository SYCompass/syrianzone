import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { headers } from "next/headers";
import { cache } from "react";

export const runtime = "nodejs";

async function fetchLeaderboard(date?: string) {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const base = host ? `${proto}://${host}` : "http://127.0.0.1:3000";
  const query = `query Leaderboard($slug: String!, $date: String) { leaderboard(slug: $slug, date: $date) { candidateId name imageUrl votes score rank } }`;
  const res = await fetch(`${base}/api/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { slug: "best-ministers", date } }),
    next: { revalidate: 86400 },
  });
  const json = await res.json();
  return json.data.leaderboard as Array<{ candidateId: string; name: string; imageUrl?: string; votes: number; score: number; rank: number }>;
}

export default async function Page({ searchParams }: { searchParams: { date?: string } }) {
  const rows = await fetchLeaderboard(searchParams.date);
  return (
    <main className="container mx-auto px-4 pt-10 pb-8">
      <h1 className="text-2xl font-bold mb-4 text-center">الأرشيف اليومي</h1>
      <div className="max-w-screen-md mx-auto">
        <Card>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>المرشح</Th>
                  <Th>النقاط</Th>
                  <Th>الأصوات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((r) => (
                  <Tr key={r.candidateId}>
                    <Td>#{r.rank}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={r.imageUrl || ""} alt={r.name} size={28} />
                        <span className="text-sm">{r.name}</span>
                      </div>
                    </Td>
                    <Td>{r.score}</Td>
                    <Td>{r.votes}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



