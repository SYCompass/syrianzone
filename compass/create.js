// تعريف المتغيرات الرئيسية
let questions = [];
let nextId = 1;

// استدعاء ملف الأسئلة الموجود
async function loadExistingQuestions() {
    try {
        console.log("بدء تحميل الأسئلة...");
        const response = await fetch('questions.js');
        if (!response.ok) {
            throw new Error(`فشل في تحميل الملف: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        console.log("تم تحميل النص، طول النص:", text.length);

        // استخراج الأسئلة من الملف
        const authLibMatch = text.match(/const AUTH_LIB_QUESTIONS = \[([\s\S]*?)\];/);
        const relSecMatch = text.match(/const REL_SEC_QUESTIONS = \[([\s\S]*?)\];/);
        const socCapMatch = text.match(/const SOC_CAP_QUESTIONS = \[([\s\S]*?)\];/);
        const natGlobMatch = text.match(/const NAT_GLOB_QUESTIONS = \[([\s\S]*?)\];/);
        const milPacMatch = text.match(/const MIL_PAC_QUESTIONS = \[([\s\S]*?)\];/);
        const retRecMatch = text.match(/const RET_REC_QUESTIONS = \[([\s\S]*?)\];/);

        console.log("نتائج استخراج النصوص:", {
            authLib: !!authLibMatch,
            relSec: !!relSecMatch,
            socCap: !!socCapMatch,
            natGlob: !!natGlobMatch,
            milPac: !!milPacMatch,
            retRec: !!retRecMatch
        });

        // تحويل النصوص إلى كائنات بواسطة Function
        if (authLibMatch) parseQuestions(authLibMatch[1], 'auth_lib');
        if (relSecMatch) parseQuestions(relSecMatch[1], 'rel_sec');
        if (socCapMatch) parseQuestions(socCapMatch[1], 'soc_cap');
        if (natGlobMatch) parseQuestions(natGlobMatch[1], 'nat_glob');
        if (milPacMatch) parseQuestions(milPacMatch[1], 'mil_pac');
        if (retRecMatch) parseQuestions(retRecMatch[1], 'ret_rec');

        // تحديد آخر معرف
        if (questions.length > 0) {
            nextId = Math.max(...questions.map(q => q.id)) + 1;
        }

        console.log(`تم تحميل ${questions.length} سؤال بنجاح`);

        // عرض الأسئلة في الواجهة
        renderQuestions();
    } catch (error) {
        console.error('خطأ في تحميل الأسئلة:', error);
        // في حالة الفشل، نقوم بتحميل البيانات المضمنة
        console.log('محاولة تحميل البيانات المضمنة...');
        loadEmbeddedQuestions();
    }
}

// تحميل الأسئلة المضمنة في حالة فشل الاستدعاء من الملف
function loadEmbeddedQuestions() {
    const questionsData = `
// 1. سلطويّة مقابل ليبرالية (Authoritarian ↔ Libertarian)
const AUTH_LIB_QUESTIONS = [
{
id: 1,
text: "يجب على الدولة تجريم الاستهزاء برموز الثورة كالعلم والشهداء",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: -1 // سلطوي
},
{
id: 2,
text: "يجب على الدولة تجريم تمجيد الأسد ورموز النظام السابق",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: -1 // سلطوي
},
{
id: 3,
text: "يجب على الدولة حظر رفع العلم السوري الأحمر السابق واستخدامه كرمز",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: -1 // سلطوي
},
{
id: 4,
text: "يجب على الدولة حظر المشاركة السياسية لكل الأعضاء العاملين في حزب البعث",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: -1 // سلطوي
},
{
id: 5,
text: "يجب على قوانين تجريم الأسدية أن تكون ذات أثر رجعي، أي أن تشمل ما حدث قبل صدور القانون",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: -1 // سلطوي
},
{
id: 6,
text: "يجب على الدولة توثيق أحداث الثورة في سردية رسمية يمنع الطعن بها",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: -1 // سلطوي
},
{
id: 7,
text: "يجب على الدولة العمل على فرض حد معين من القواعد الأخلاقية في المجتمع",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: -1 // سلطوي
},
{
id: 8,
text: "يجب على الدولة السماح بتشكيل الأحزاب والترويج لها",
category: "auth_lib",
categoryText: "سلطويّة مقابل ليبرالية",
effect: 1 // ليبرالي
}
];

// 2. ديني مقابل علماني (Religious ↔ Secular)
const REL_SEC_QUESTIONS = [
{
id: 9,
text: "يجب على الدولة إقرار الزواج المدني بغض النظر عن الطائفة أو الدين",
category: "rel_sec",
categoryText: "ديني مقابل علماني",
effect: 1 // علماني
},
{
id: 10,
text: "يجب على الدولة أن تميّز المواطن المسلم تمييزاً إيجابياً وتقدم له حقوق وواجبات إضافيّة",
category: "rel_sec",
categoryText: "ديني مقابل علماني",
effect: -1 // ديني
},
{
id: 11,
text: "يجب على الدولة حماية حق الأديان المختلفة في العبادة في المساحات العامة",
category: "rel_sec",
categoryText: "ديني مقابل علماني",
effect: -0.5 // ديني معتدل
},
{
id: 12,
text: "يجب على الدولة دعم المنظمات الدينية مادياً",
category: "rel_sec",
categoryText: "ديني مقابل علماني",
effect: -1 // ديني
},
{
id: 13,
text: "يجب ألّا تتدخل الدولة في الحياة الدينية للمواطنين",
category: "rel_sec",
categoryText: "ديني مقابل علماني",
effect: 0.5 // علماني معتدل
}
];

// 3. اقتصادي اشتراكي مقابل اقتصادي ليبرالي (Socialist ↔ Capitalist)
const SOC_CAP_QUESTIONS = [
{
id: 18,
text: "يجب أن يكون التعليم في الجامعات والمدارس مجانيّ لكافة المواطنين",
category: "soc_cap",
categoryText: "اقتصادي اشتراكي مقابل اقتصادي ليبرالي",
effect: -1 // اشتراكي
},
{
id: 19,
text: "يجب أن تكون الطبابة مجّانيّة لكافة المواطنين",
category: "soc_cap",
categoryText: "اقتصادي اشتراكي مقابل اقتصادي ليبرالي",
effect: -1 // اشتراكي
}
];
    `;

    // استخراج الأسئلة من النص المضمن
    const authLibMatch = questionsData.match(/const AUTH_LIB_QUESTIONS = \[([\s\S]*?)\];/);
    const relSecMatch = questionsData.match(/const REL_SEC_QUESTIONS = \[([\s\S]*?)\];/);
    const socCapMatch = questionsData.match(/const SOC_CAP_QUESTIONS = \[([\s\S]*?)\];/);

    // تحويل النصوص إلى كائنات
    if (authLibMatch) parseQuestions(authLibMatch[1], 'auth_lib');
    if (relSecMatch) parseQuestions(relSecMatch[1], 'rel_sec');
    if (socCapMatch) parseQuestions(socCapMatch[1], 'soc_cap');

    // تحديد آخر معرف
    if (questions.length > 0) {
        nextId = Math.max(...questions.map(q => q.id)) + 1;
    }

    console.log(`تم تحميل ${questions.length} سؤال من البيانات المضمنة`);

    // عرض الأسئلة في الواجهة
    renderQuestions();
}

// تحليل نص الأسئلة إلى كائنات
function parseQuestions(text, category) {
    try {
        // طريقة أكثر دقة لاستخراج الأسئلة
        // البحث عن كل الكائنات بشكل منفصل
        const regex = /{([^}]*)}/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const questionObj = match[0];

            // استخراج البيانات من النص
            const idMatch = questionObj.match(/id:\s*(\d+)/);
            const textMatch = questionObj.match(/text:\s*"([^"]*)"/);
            const effectMatch = questionObj.match(/effect:\s*([-\d.]+)/);

            if (idMatch && textMatch && effectMatch) {
                const id = parseInt(idMatch[1]);
                const text = textMatch[1];
                const effect = parseFloat(effectMatch[1]);

                let categoryText = '';
                switch (category) {
                    case 'auth_lib': categoryText = 'سلطويّة مقابل ليبرالية'; break;
                    case 'rel_sec': categoryText = 'ديني مقابل علماني'; break;
                    case 'soc_cap': categoryText = 'اقتصادي اشتراكي مقابل اقتصادي ليبرالي'; break;
                    case 'nat_glob': categoryText = 'قومي مقابل عالمي'; break;
                    case 'mil_pac': categoryText = 'عسكري توسّعي مقابل سلمي انعزالي'; break;
                    case 'ret_rec': categoryText = 'عدالة انتقالية انتقامية مقابل تصالحية'; break;
                }

                questions.push({
                    id,
                    text,
                    category,
                    categoryText,
                    effect
                });

                console.log(`تمت إضافة سؤال: ${id} - ${category}`);
            }
        }
    } catch (error) {
        console.error('خطأ في تحليل الأسئلة:', error);
    }
}

// عرض الأسئلة في الواجهة
function renderQuestions() {
    // تفريغ جميع الأقسام
    document.querySelectorAll('[id$="_questions"]').forEach(container => {
        container.innerHTML = '';
    });

    // تصنيف الأسئلة حسب الفئة
    const questionsByCategory = {
        auth_lib: questions.filter(q => q.category === 'auth_lib'),
        rel_sec: questions.filter(q => q.category === 'rel_sec'),
        soc_cap: questions.filter(q => q.category === 'soc_cap'),
        nat_glob: questions.filter(q => q.category === 'nat_glob'),
        mil_pac: questions.filter(q => q.category === 'mil_pac'),
        ret_rec: questions.filter(q => q.category === 'ret_rec')
    };

    // إنشاء بطاقات الأسئلة لكل فئة
    Object.entries(questionsByCategory).forEach(([category, categoryQuestions]) => {
        const container = document.getElementById(`${category}_questions`);

        // عرض عدد الأسئلة في كل فئة
        const categoryTitle = container.parentElement.querySelector('h3');
        categoryTitle.innerHTML = `${categoryTitle.textContent.split('(')[0]} <span class="text-sm text-gray-500">(${categoryQuestions.length} سؤال)</span>`;

        categoryQuestions.forEach(question => {
            const card = createQuestionCard(question);
            container.appendChild(card);
        });

        // تطبيق تأثيرات GSAP بطريقة مختلفة
        if (container.children.length > 0) {
            // استخدام تأثير متدرج للعناصر بدون تلاشي
            gsap.fromTo(container.children,
                { y: 20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.3,
                    stagger: 0.05,
                    clearProps: "all", // إزالة التنسيق بعد الانتهاء من التأثير
                    ease: "power1.out"
                }
            );
        }
    });
}

// إنشاء بطاقة سؤال
function createQuestionCard(question) {
    const card = document.createElement('div');
    card.className = 'question-card bg-gray-50 border border-gray-200 rounded-md p-3 relative';
    card.dataset.id = question.id;

    // تحديد لون التأثير
    let effectColor = '';
    let effectText = '';

    if (question.effect < 0) {
        effectColor = question.effect === -1 ? 'rgb(239 68 68)' : 'rgb(249 115 22)';
        effectText = question.effect === -1 ? 'اليسار تماماً' : 'اليسار المعتدل';
    } else {
        effectColor = question.effect === 1 ? 'rgb(34 197 94)' : 'rgb(132 204 22)';
        effectText = question.effect === 1 ? 'اليمين تماماً' : 'اليمين المعتدل';
    }

    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <span class="text-xs text-gray-500">رقم ${question.id}</span>
            <span class="px-2 py-1 text-xs rounded-full text-white" style="background-color: ${effectColor}">${effectText} (${question.effect})</span>
        </div>
        <p class="text-gray-800 mb-3">${question.text}</p>
        <div class="flex justify-end">
            <button class="delete-question text-red-500 hover:text-red-700" data-id="${question.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    // إضافة حدث للحذف
    card.querySelector('.delete-question').addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        deleteQuestion(id);
    });

    return card;
}

// حذف سؤال
function deleteQuestion(id) {
    if (confirm('هل أنت متأكد من رغبتك بحذف هذا السؤال؟')) {
        const index = questions.findIndex(q => q.id === id);
        if (index !== -1) {
            questions.splice(index, 1);
            renderQuestions();
        }
    }
}

// إضافة سؤال جديد
function addQuestion(text, category, effect) {
    // تحديد نص الفئة
    let categoryText = '';
    switch (category) {
        case 'auth_lib': categoryText = 'سلطويّة مقابل ليبرالية'; break;
        case 'rel_sec': categoryText = 'ديني مقابل علماني'; break;
        case 'soc_cap': categoryText = 'اقتصادي اشتراكي مقابل اقتصادي ليبرالي'; break;
        case 'nat_glob': categoryText = 'قومي مقابل عالمي'; break;
        case 'mil_pac': categoryText = 'عسكري توسّعي مقابل سلمي انعزالي'; break;
        case 'ret_rec': categoryText = 'عدالة انتقالية انتقامية مقابل تصالحية'; break;
    }

    const newQuestion = {
        id: nextId++,
        text,
        category,
        categoryText,
        effect: parseFloat(effect)
    };

    questions.push(newQuestion);
    renderQuestions();

    // تمرير إلى البطاقة الجديدة
    setTimeout(() => {
        const card = document.querySelector(`[data-id="${newQuestion.id}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            gsap.from(card, {
                scale: 0.8,
                backgroundColor: '#e5f7ff',
                duration: 1
            });
        }
    }, 100);
}

// إنشاء ملف النص للتحميل
function generateQuestionsFile() {
    // تصنيف الأسئلة حسب الفئة
    const authLib = questions.filter(q => q.category === 'auth_lib');
    const relSec = questions.filter(q => q.category === 'rel_sec');
    const socCap = questions.filter(q => q.category === 'soc_cap');
    const natGlob = questions.filter(q => q.category === 'nat_glob');
    const milPac = questions.filter(q => q.category === 'mil_pac');
    const retRec = questions.filter(q => q.category === 'ret_rec');

    // تكوين كل قسم
    const formatQuestions = (questions, commentName) => {
        let result = '';
        questions.forEach(q => {
            let effectComment = '';
            if (q.category === 'auth_lib') effectComment = q.effect < 0 ? 'سلطوي' : 'ليبرالي';
            else if (q.category === 'rel_sec') effectComment = q.effect < 0 ? 'ديني' : 'علماني';
            else if (q.category === 'soc_cap') effectComment = q.effect < 0 ? 'اشتراكي' : 'رأسمالي';
            else if (q.category === 'nat_glob') effectComment = q.effect < 0 ? 'قومي' : 'عالمي';
            else if (q.category === 'mil_pac') effectComment = q.effect < 0 ? 'عسكري' : 'سلمي';
            else if (q.category === 'ret_rec') effectComment = q.effect < 0 ? 'انتقامية' : 'تصالحية';

            if (Math.abs(q.effect) !== 1) effectComment += ' معتدل';

            result += `    {
id: ${q.id},
text: "${q.text}",
category: "${q.category}",
categoryText: "${q.categoryText}",
effect: ${q.effect} // ${effectComment}
},\n`;
        });

        return result.length > 0 ? result.slice(0, -1) : ''; // إزالة الفاصلة الأخيرة
    };

    // تكوين الملف الكامل
    const fileContent = `/**
* بوصلة سوريا - Syria Compass
* قائمة الأسئلة والعبارات للاختبار
*/
// 1. سلطويّة مقابل ليبرالية (Authoritarian ↔ Libertarian)
const AUTH_LIB_QUESTIONS = [
${formatQuestions(authLib)}
];

// 2. ديني مقابل علماني (Religious ↔ Secular)
const REL_SEC_QUESTIONS = [
${formatQuestions(relSec)}
];

// 3. اقتصادي اشتراكي مقابل اقتصادي ليبرالي (Socialist ↔ Capitalist)
const SOC_CAP_QUESTIONS = [
${formatQuestions(socCap)}
];

// 4. قومي مقابل عالمي (Nationalist ↔ Globalist)
const NAT_GLOB_QUESTIONS = [
${formatQuestions(natGlob)}
];

// 5. عسكري توسّعي مقابل سلمي انعزالي (Militarist ↔ Pacifist)
const MIL_PAC_QUESTIONS = [
${formatQuestions(milPac)}
];

// 6. عدالة انتقالية انتقامية مقابل تصالحية (Retributive ↔ Reconciliatory Justice)
const RET_REC_QUESTIONS = [
${formatQuestions(retRec)}
];

const QUESTIONS = [
...AUTH_LIB_QUESTIONS,
...REL_SEC_QUESTIONS,
...SOC_CAP_QUESTIONS,
...NAT_GLOB_QUESTIONS,
...MIL_PAC_QUESTIONS,
...RET_REC_QUESTIONS
];

/**
* @typedef {Object} Scale
* @property {string} id - رمز المقياس
* @property {string} name - اسم المقياس
* @property {string} left - اسم الطرف اليساري للمقياس
* @property {string} right - اسم الطرف اليميني للمقياس
*/

/**
* @type {Scale[]}
*/
const SCALES = [
{
id: "auth_lib",
name: "سلطويّة مقابل ليبرالية",
left: "سلطويّة",
right: "ليبرالية"
},
{
id: "rel_sec",
name: "ديني مقابل علماني",
left: "ديني",
right: "علماني"
},
{
id: "soc_cap",
name: "اقتصادي اشتراكي مقابل اقتصادي ليبرالي",
left: "اشتراكي",
right: "رأسمالي"
},
{
id: "nat_glob",
name: "قومي مقابل عالمي",
left: "قومي",
right: "عالمي"
},
{
id: "mil_pac",
name: "عسكري توسّعي مقابل سلمي انعزالي",
left: "عسكري",
right: "سلمي"
},
{
id: "ret_rec",
name: "عدالة انتقالية انتقامية مقابل تصالحية",
left: "انتقامية",
right: "تصالحية"
}
]; `;

    return fileContent;
}

// حفظ الملف وتنزيله
function saveAndDownload() {
    const content = generateQuestionsFile();
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.js';
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);

    // عرض رسالة نجاح
    alert('تم تنزيل الملف بنجاح!');
}

// حدث زر الحفظ
document.getElementById('saveButton').addEventListener('click', saveAndDownload);

// تحميل الأسئلة عند بدء التطبيق
loadExistingQuestions();

// تفعيل أزرار التمرير الأفقي
document.querySelector('.scroll-left').addEventListener('click', () => {
    const container = document.querySelector('.kanban-container');
    container.scrollBy({ left: -350, behavior: 'smooth' });
});

document.querySelector('.scroll-right').addEventListener('click', () => {
    const container = document.querySelector('.kanban-container');
    container.scrollBy({ left: 350, behavior: 'smooth' });
});

// إضافة دالة لتحديث خيارات التأثير بناءً على الفئة المحددة
function updateEffectOptions() {
    const category = document.getElementById('category').value;
    const effectSelect = document.getElementById('effect');
    
    // تحديد المصطلحات المناسبة لكل فئة
    let leftExtreme = '';
    let leftModerate = '';
    let rightModerate = '';
    let rightExtreme = '';
    
    switch (category) {
        case 'auth_lib':
            leftExtreme = 'سلطوي تماماً';
            leftModerate = 'سلطوي معتدل';
            rightModerate = 'ليبرالي معتدل';
            rightExtreme = 'ليبرالي تماماً';
            break;
        case 'rel_sec':
            leftExtreme = 'ديني تماماً';
            leftModerate = 'ديني معتدل';
            rightModerate = 'علماني معتدل';
            rightExtreme = 'علماني تماماً';
            break;
        case 'soc_cap':
            leftExtreme = 'اشتراكي تماماً';
            leftModerate = 'اشتراكي معتدل';
            rightModerate = 'رأسمالي معتدل';
            rightExtreme = 'رأسمالي تماماً';
            break;
        case 'nat_glob':
            leftExtreme = 'قومي تماماً';
            leftModerate = 'قومي معتدل';
            rightModerate = 'عالمي معتدل';
            rightExtreme = 'عالمي تماماً';
            break;
        case 'mil_pac':
            leftExtreme = 'عسكري تماماً';
            leftModerate = 'عسكري معتدل';
            rightModerate = 'سلمي معتدل';
            rightExtreme = 'سلمي تماماً';
            break;
        case 'ret_rec':
            leftExtreme = 'انتقامية تماماً';
            leftModerate = 'انتقامية معتدلة';
            rightModerate = 'تصالحية معتدلة';
            rightExtreme = 'تصالحية تماماً';
            break;
    }
    
    // تحديث نص الخيارات
    const currentValue = effectSelect.value; // حفظ القيمة الحالية
    
    effectSelect.innerHTML = `
        <option value="-1">-1 (${leftExtreme})</option>
        <option value="-0.5">-0.5 (${leftModerate})</option>
        <option value="0.5">0.5 (${rightModerate})</option>
        <option value="1">1 (${rightExtreme})</option>
    `;
    
    // استعادة القيمة المحددة سابقاً إذا كانت موجودة
    if (currentValue) {
        effectSelect.value = currentValue;
    }
}

// إضافة مستمع حدث للفئة لتحديث خيارات التأثير عند التغيير
document.getElementById('category').addEventListener('change', updateEffectOptions);

// تحديث الخيارات عند تحميل الصفحة
window.addEventListener('load', () => {
    updateEffectOptions();
    initAddButtons();
});

// تهيئة أزرار إضافة سؤال
function initAddButtons() {
    const addQuestionButtons = document.querySelectorAll('.add-question-btn');
    
    if (addQuestionButtons.length === 0) {
        console.error('لم يتم العثور على أي زر إضافة!');
        alert('تنبيه: لم يتم العثور على أزرار الإضافة. يرجى التحقق من الكونسول.');
    }
    
    // فتح النافذة عند النقر على زر إضافة
    addQuestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('تم النقر على زر الإضافة:', button.getAttribute('data-category'));
            
            // تعيين التصنيف في النموذج بناءً على الزر المنقور عليه
            const category = button.getAttribute('data-category');
            document.getElementById('category').value = category;
            
            // تحديث خيارات التأثير حسب التصنيف المحدد
            updateEffectOptions();
            
            // إظهار النافذة
            openModal();
        });
    });
    
    console.log('تمت تهيئة أزرار الإضافة، عدد الأزرار:', addQuestionButtons.length);
}

// التعامل مع نافذة إضافة السؤال (Modal)
const questionModal = document.getElementById('questionModal');
const closeModal = document.getElementById('closeModal');

// فتح النافذة
function openModal() {
    questionModal.classList.remove('hidden');
    questionModal.classList.add('flex');
    
    // التركيز على حقل النص
    document.getElementById('questionText').focus();
}

// إغلاق النافذة
function closeModalWindow() {
    questionModal.classList.add('hidden');
    questionModal.classList.remove('flex');
}

// إغلاق النافذة عند النقر على زر الإغلاق
closeModal.addEventListener('click', closeModalWindow);

// إغلاق النافذة عند النقر خارج النموذج
questionModal.addEventListener('click', (event) => {
    if (event.target === questionModal) {
        closeModalWindow();
    }
});

// تعديل دالة إرسال النموذج لإغلاق النافذة بعد الإضافة
document.getElementById('questionForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const text = document.getElementById('questionText').value.trim();
    const category = document.getElementById('category').value;
    const effect = parseFloat(document.getElementById('effect').value);
    
    // التحقق من طول السؤال
    if (text.length < 5) {
        alert('الرجاء إدخال نص سؤال صحيح');
        return;
    }
    
    if (text) {
        addQuestion(text, category, effect);
        
        // إغلاق النافذة بعد الإضافة
        closeModalWindow();
        
        // إعادة تعيين النموذج
        document.getElementById('questionText').value = '';
    }
});