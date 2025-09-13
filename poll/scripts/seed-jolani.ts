import { db } from "@/db";
import { candidates, polls } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

type JolaniPersona = { id: string; name: string; imageUrl: string };

const JOLANI_PERSONAS: JolaniPersona[] = [
  { id: "jolani1", name: "جولانسكي", imageUrl: "/tierlist/images/jolani/jolani1.webp" },
  { id: "jolani2", name: "جوكاسترو", imageUrl: "/tierlist/images/jolani/jolani2.webp" },
  { id: "jolani3", name: "جولادن", imageUrl: "/tierlist/images/jolani/jolani3.webp" },
  { id: "jolani4", name: "جورسمي", imageUrl: "/tierlist/images/jolani/jolani4.webp" },
  { id: "jolani5", name: "المركزاني", imageUrl: "/tierlist/images/jolani/jolani5.webp" },
  { id: "jolani6", name: "الغاضب", imageUrl: "/tierlist/images/jolani/jolani6.webp" },
  { id: "jolani7", name: "أحمد الدستور", imageUrl: "/tierlist/images/jolani/jolani7.avif" },
  { id: "jolani8", name: "الفولاني", imageUrl: "/tierlist/images/jolani/jolani8.webp" },
  { id: "jolani9", name: "المجهولاني", imageUrl: "/tierlist/images/jolani/jolani9.webp" },
  { id: "jolani10", name: "جولاني محررنا", imageUrl: "/tierlist/images/jolani/jolani10.webp" },
  { id: "jolani11", name: "البيبي", imageUrl: "/tierlist/images/jolani/jolani11.png" },
  { id: "jolani12", name: "الصليبي", imageUrl: "/tierlist/images/jolani/jolani12.jpeg" },
  { id: "jolani13", name: "العلماني", imageUrl: "/tierlist/images/jolani/jolani13.jpeg" },
  { id: "jolani14", name: "الدرزي", imageUrl: "/tierlist/images/jolani/jolani14.JPG" },
  { id: "jolani15", name: "الرئاسي", imageUrl: "/tierlist/images/jolani/jolani15.JPG" },
  { id: "jolani16", name: "الكردي", imageUrl: "/tierlist/images/jolani/jolani16.JPG" },
  { id: "jolani17", name: "المخلص", imageUrl: "/tierlist/images/jolani/jolani17.JPG" },
  { id: "jolani18", name: "مظفر النعيمي", imageUrl: "/tierlist/images/jolani/jolani18.jpg" },
  { id: "jolani19", name: "التأديبي", imageUrl: "/tierlist/images/jolani/jolani19.JPG" },
  { id: "jolani20", name: "العشائري", imageUrl: "/tierlist/images/jolani/jolani20.JPG" },
  { id: "jolani21", name: "الشيعي", imageUrl: "/tierlist/images/jolani/jolani21.JPG" },
  { id: "jolani22", name: "الحجي", imageUrl: "/tierlist/images/jolani/jolani22.JPG" },
  { id: "jolani23", name: "الماكر", imageUrl: "/tierlist/images/jolani/jolani23.JPG" },
  { id: "jolani24", name: "البودكاستي", imageUrl: "/tierlist/images/jolani/jolani24.JPG" },
  { id: "jolani25", name: "الطائر", imageUrl: "/tierlist/images/jolani/jolani25.JPG" },
  { id: "jolani26", name: "الجهادي", imageUrl: "/tierlist/images/jolani/jolani26.JPG" },
  { id: "jolani27", name: "المعماري", imageUrl: "/tierlist/images/jolani/jolani27.png" },
];

async function main() {
  const slug = "jolani";
  const title = "شخصيات الجولاني";
  const tz = process.env.POLL_TIMEZONE || "Europe/Amsterdam";

  await db.delete(polls).where(eq(polls.slug, slug));

  const pollId = uuidv4();
  await db.insert(polls).values({ id: pollId, slug, title, timezone: tz });

  await db.insert(candidates).values(
    JOLANI_PERSONAS.map((p, i) => ({ id: p.id, pollId, name: p.name, imageUrl: p.imageUrl, sort: i, category: "jolani" }))
  );

  console.log("Seeded Jolani poll and personas (", JOLANI_PERSONAS.length, ")");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


