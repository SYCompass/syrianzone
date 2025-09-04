import { db } from "@/db";
import { candidates, polls } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

const MINISTERS: Array<{ id: string; name: string; imageUrl: string; title?: string | null }> = [
  { id: "item1", name: "أسعد حسن الشيباني", imageUrl: "/tierlist/images/item1.webp", title: "وزير الخارجية والمغتربين" },
  { id: "item2", name: "مرهف أبو قصرة", imageUrl: "/tierlist/images/item2.webp", title: "وزير الدفاع" },
  { id: "item3", name: "أنس خطاب", imageUrl: "/tierlist/images/item3.webp", title: "وزير الداخلية" },
  { id: "item4", name: "محمد عنجراني", imageUrl: "/tierlist/images/item4.webp", title: "وزير الإدارة المحلية" },
  { id: "item5", name: "مظهر الويس", imageUrl: "/tierlist/images/item5.webp", title: "وزير العدل" },
  { id: "item6", name: "محمد البشير", imageUrl: "/tierlist/images/item6.webp", title: "وزير الطاقة" },
  { id: "item7", name: "مروان الحلبي", imageUrl: "/tierlist/images/item7.webp", title: "وزير التعليم العالي" },
  { id: "item8", name: "هند قبوات", imageUrl: "/tierlist/images/item8.webp", title: "وزيرة العمل والشؤون الاجتماعية" },
  { id: "item9", name: "محمد صالح", imageUrl: "/tierlist/images/item9.webp", title: "وزير الثقافة" },
  { id: "item10", name: "نضال الشعار", imageUrl: "/tierlist/images/item10.webp", title: "وزير الاقتصاد" },
  { id: "item11", name: "حمزة المصطفى", imageUrl: "/tierlist/images/item11.webp", title: "وزير الإعلام" },
  { id: "item12", name: "يعرب بدر", imageUrl: "/tierlist/images/item12.webp", title: "وزير النقل" },
  { id: "item13", name: "محمد يسر برنية", imageUrl: "/tierlist/images/item13.webp", title: "وزير المالية" },
  { id: "item14", name: "مصعب نزال العلي", imageUrl: "/tierlist/images/item14.webp", title: "وزير الصحة" },
  { id: "item15", name: "رائد الصالح", imageUrl: "/tierlist/images/item15.webp", title: "وزير الطوارئ والكوارث" },
  { id: "item16", name: "عبد السلام هيكل", imageUrl: "/tierlist/images/item16.webp", title: "وزير الاتصالات وتقانة المعلومات" },
  { id: "item17", name: "أمجد بدر", imageUrl: "/tierlist/images/item17.webp", title: "وزير الزراعة" },
  { id: "item18", name: "محمد تركو", imageUrl: "/tierlist/images/item18.webp", title: "وزير التربية" },
  { id: "item19", name: "مصطفى عبد الرزاق", imageUrl: "/tierlist/images/item19.webp", title: "وزير الأشغال العامة والإسكان" },
  { id: "item20", name: "محمد سامح حامض", imageUrl: "/tierlist/images/item20.webp", title: "وزير الرياضة والشباب" },
  { id: "item21", name: "مازن الصالحاني", imageUrl: "/tierlist/images/item21.webp", title: "وزير السياحة" },
  { id: "item22", name: "محمد حسان سكاف", imageUrl: "/tierlist/images/item22.webp", title: "وزير التنمية الإدارية" },
  { id: "item23", name: "محمد أبو الخير شكري", imageUrl: "/tierlist/images/item23.webp", title: "وزير الأوقاف" },
];

async function main() {
  // Clear any existing data for this slug (CASCADE will remove related rows)
  await db.delete(polls).where(eq(polls.slug, "best-ministers"));

  const pollId = uuidv4();
  const tz = process.env.POLL_TIMEZONE || "Europe/Amsterdam";
  await db.insert(polls).values({ id: pollId, slug: "best-ministers", title: "تقييم الوزراء", timezone: tz });
  await db.insert(candidates).values(
    MINISTERS.map((m, i) => ({ id: m.id, pollId, name: m.name, title: m.title ?? null, imageUrl: m.imageUrl, sort: i }))
  );
  console.log("Seeded poll and candidates");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



