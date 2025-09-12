"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AlgorithmInfo() {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-8 flex justify-center">
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>عن خوارزمية الترتيب</Button>
            {open ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
    <div className="relative z-10 w-[min(680px,92vw)] rounded bg-white dark:bg-[#0D1315] p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">خوارزمية الترتيب</h3>
        <button onClick={() => setOpen(false)} aria-label="Close" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">✕</button>
      </div>

      <div className="overflow-x-auto" dir="rtl">
        <table className="w-full text-sm border border-gray-200 dark:border-neutral-800 rounded">
          <thead className="bg-gray-100 dark:bg-[#0D1315]">
            <tr>
              <th className="p-2 border">التيير</th>
              <th className="p-2 border">النقاط الأساسية</th>
              <th className="p-2 border">المكافأة حسب المركز</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border font-medium">S</td>
              <td className="p-2 border">50</td>
              <td className="p-2 border">الأول +5، الثاني +3، الثالث +1</td>
            </tr>
            <tr>
              <td className="p-2 border font-medium">A</td>
              <td className="p-2 border">40</td>
              <td className="p-2 border">الأول +4، الثاني +2، الثالث +1</td>
            </tr>
            <tr>
              <td className="p-2 border font-medium">B</td>
              <td className="p-2 border">30</td>
              <td className="p-2 border">الأول +3، الثاني +2، الثالث +1</td>
            </tr>
            <tr>
              <td className="p-2 border font-medium">C</td>
              <td className="p-2 border">20</td>
              <td className="p-2 border">الأول +2، الثاني +1</td>
            </tr>
            <tr>
              <td className="p-2 border font-medium">D</td>
              <td className="p-2 border">10</td>
              <td className="p-2 border">الأول +1</td>
            </tr>
            <tr>
              <td className="p-2 border font-medium">F</td>
              <td className="p-2 border">0</td>
              <td className="p-2 border">لا يوجد مكافأة</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 space-y-2" dir="rtl">
          <p>
            يعتمد الترتيب في الجداول على «المعدّل»، وهو متوسط النقاط لكل صوت،
            أي <span className="font-semibold">المعدّل = مجموع النقاط ÷ مجموع الأصوات</span>.
            نعرض كذلك إجمالي النقاط والأصوات للشفافية، لكن الفرز يتم بحسب المعدّل أولاً.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            إذا كان عدد الأصوات صفراً، يظهر المعدّل بقيمة 0 لتجنّب القسمة على صفر.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" dir="rtl">
        <a
          href="https://github.com/SYCompass/syrianzone/tree/main/poll"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-black"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.8-1.6-3.8-1.6-.5-1.1-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.5 1.9 2.9 1.3.1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0c2.2-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.6-5.3 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6a11.5 11.5 0 0 0 7.9-10.9C23.5 5.65 18.35.5 12 .5Z"/>
          </svg>
          <span> الكود المصدري للخوارزمية على GitHub</span>
        </a>
      </div>
      </div>
    </div>
  </div>
) : null}


        </div>
    );
}


