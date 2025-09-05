import TierBoard from "@/components/TierBoard";
import { appRouter } from "@/server/trpc/router";
import { Card, CardContent } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page() {
  const caller = appRouter.createCaller({ ip: undefined, userAgent: undefined });
  const data = await caller.poll.getToday({ slug: "best-ministers" });
  return (
    <main className="container mx-auto px-4 pt-10 pb-8">
      <h1 className="text-3xl font-extrabold text-center mb-4">تير ليست وزراء الحكومة السورية الجديدة</h1>
      <p className="text-center text-gray-600 mb-6">يمكن حفظ صورة جاهزة لمشاركتها على السوشال ميديا بسهولة من خلال الزر الموجود في آخر الصفحة</p>
      <Card className="max-w-screen-lg mx-auto mb-6">
        <CardContent className="p-4">
          <p className="text-center text-gray-600 mb-3">في نسخة الكمبيوتر: يمكنك سحب وافلات اسم الوزير في القائمة</p>
          <p className="text-center text-gray-600">في نسخة الموبايل: يمكنك النقر على اسم الوزير ثم النقر على المكان في القائمة لنقله</p>
        </CardContent>
      </Card>
      <TierBoard initialCandidates={data.candidates} pollId={data.poll.id} voteDay={data.voteDay.toISOString()} />
    </main>
  );
}



