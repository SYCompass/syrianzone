import { db } from "@/db";
import { candidates, polls } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

const MINISTERS: Array<{ id: string; name: string; imageUrl: string }> = [
  { id: "item1", name: "أسعد حسن الشيباني وزير الخارجية والمغتربين", imageUrl: "/tierlist/images/item1.webp" },
  { id: "item2", name: "مرهف أبو قصرة وزير الدفاع", imageUrl: "/tierlist/images/item2.webp" },
  { id: "item3", name: "أنس خطاب وزير الداخلية", imageUrl: "/tierlist/images/item3.webp" },
  { id: "item4", name: "محمد عنجراني وزير الإدارة المحلية", imageUrl: "/tierlist/images/item4.webp" },
  { id: "item5", name: "مظهر الويس وزير العدل", imageUrl: "/tierlist/images/item5.webp" },
  { id: "item6", name: "محمد البشير وزير الطاقة", imageUrl: "/tierlist/images/item6.webp" },
  { id: "item7", name: "مروان الحلبي وزير التعليم العالي", imageUrl: "/tierlist/images/item7.webp" },
  { id: "item8", name: "هند قبوات وزيرة العمل والشؤون الاجتماعية", imageUrl: "/tierlist/images/item8.webp" },
  { id: "item9", name: "محمد صالح وزير الثقافة", imageUrl: "/tierlist/images/item9.webp" },
  { id: "item10", name: "نضال الشعار وزير الاقتصاد", imageUrl: "/tierlist/images/item10.webp" },
  { id: "item11", name: "حمزة المصطفى وزير الإعلام", imageUrl: "/tierlist/images/item11.webp" },
  { id: "item12", name: "يعرب بدر وزير النقل", imageUrl: "/tierlist/images/item12.webp" },
  { id: "item13", name: "محمد يسر برنية وزير المالية", imageUrl: "/tierlist/images/item13.webp" },
  { id: "item14", name: "مصعب نزال العلي وزير الصحة", imageUrl: "/tierlist/images/item14.webp" },
  { id: "item15", name: "رائد الصالح وزير الطوارئ والكوارث", imageUrl: "/tierlist/images/item15.webp" },
  { id: "item16", name: "عبد السلام هيكل وزير الاتصالات وتقانة المعلومات", imageUrl: "/tierlist/images/item16.webp" },
  { id: "item17", name: "أمجد بدر وزير الزراعة", imageUrl: "/tierlist/images/item17.webp" },
  { id: "item18", name: "محمد تركو وزير التربية", imageUrl: "/tierlist/images/item18.webp" },
  { id: "item19", name: "مصطفى عبد الرزاق وزير الأشغال العامة والإسكان", imageUrl: "/tierlist/images/item19.webp" },
  { id: "item20", name: "محمد سامح حامض وزير الرياضة والشباب", imageUrl: "/tierlist/images/item20.webp" },
  { id: "item21", name: "مازن الصالحاني وزير السياحة", imageUrl: "/tierlist/images/item21.webp" },
  { id: "item22", name: "محمد حسان سكاف وزير التنمية الإدارية", imageUrl: "/tierlist/images/item22.webp" },
  { id: "item23", name: "محمد أبو الخير شكري وزير الأوقاف", imageUrl: "/tierlist/images/item23.webp" },
];

async function main() {
  const pollId = uuidv4();
  const tz = process.env.POLL_TIMEZONE || "Europe/Amsterdam";
  await db.insert(polls).values({ id: pollId, slug: "best-ministers", title: "تقييم الوزراء", timezone: tz });
  await db.insert(candidates).values(
    MINISTERS.map((m, i) => ({ id: m.id, pollId, name: m.name, imageUrl: m.imageUrl, sort: i }))
  );
  console.log("Seeded poll and candidates");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



