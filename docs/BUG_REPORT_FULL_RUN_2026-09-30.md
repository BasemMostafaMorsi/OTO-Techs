# Bug report — Luxora — 2026-09-30

التشغيل الكامل للاختبارات المنفذة في المستودع: **31 اختبارًا**؛ **24 نجح**، **7 فشل**، **0 متخطّى على مستوى الاختبار**.

البيئة: https://luxora.poweritech.com — Chromium ظاهر، عامل واحد، دون إعادة محاولة. البداية 2026-09-30T15:02:29.221Z والنهاية 2026-09-30T15:08:48.684Z (UTC)، المدة 379 ثانية. الأمر: `npx playwright test --reporter=list,allure-playwright`.

هذا تشغيل كل الاختبارات الموجودة، وليس تنفيذ الـ45 سيناريو المالي التصميمي. خمسة اختبارات تخص أدوات CSV والحساب العشري. خطوة ربط جهة الاتصال بالمندوب متخطاة بطلب المستخدم السابق. لم يُغيّر كود التطبيق أو يُنشر شيء أثناء هذه المراجعة. الأولويات أدناه مقترحة.

[كل النتائج والأخطاء وخطوات الفشل وتشخيصات المتصفح بصيغة JSON](../artifacts/full-suite/2026-09-30T15-02-29-221Z/summary.json). لقطات الشاشة وملفات CSV محفوظة بجوار الملخص. تم تعطيل الفيديو وtrace لتقليل حجم الملفات.

## الأعطال وحالات الفشل

### LUX-001 — اسم جهة الاتصال القديم يستمر في صفحة التفاصيل بعد الحفظ

**الخطورة/الأولوية المقترحة:** متوسط — P1. **الحالة:** أُعيد إنتاج الفشل في هذا التشغيل.

**خطوات الإعادة:** إنشاء جهة اتصال تجريبية → فتح Edit → تغيير Name → Save → فتح صفحة التفاصيل.

**المتوقع:** عرض الاسم الجديد المحفوظ في صفحة التفاصيل.

**الفعلي:** الاسم الظاهر في النموذج والاسم المرسل في طلب PUT يطابقان الاسم الجديد، وطلب الحفظ نجح؛ صفحة التفاصيل استمرت في عرض الاسم القديم طوال مهلة التحقق (10 ثوانٍ).

**حدود الدليل والمتابعة:** هذه الأدلة لا تحدد هل السبب تخزين الخادم أو التخزين المؤقت/جلب التفاصيل. لا تُنسب المشكلة لإرسال الاسم القديم في هذا التشغيل. جهة الاتصال #54 أُزيلت بنجاح بعد الاختبار.

**ملف الاختبار:** `contact-lifecycle.spec.ts`.

**الأدلة:** [contact-name-update](../artifacts/full-suite/2026-09-30T15-02-29-221Z/8eb01a90-5961-454e-9082-bf8f0b126e3e-attachment.json) · [contact-updated-preview](../artifacts/full-suite/2026-09-30T15-02-29-221Z/0c9860c9-93c9-4339-a2c8-68f04f81bbe1-attachment.png) · [screenshot](../artifacts/full-suite/2026-09-30T15-02-29-221Z/f376730f-41aa-45ef-89fd-b2b822e06842-attachment.png) · [error-context](../artifacts/full-suite/2026-09-30T15-02-29-221Z/ecaf8bec-fe41-40dd-a3d3-e8b13943c1d6-attachment.md) · [browser-diagnostics](../artifacts/full-suite/2026-09-30T15-02-29-221Z/052551a4-085d-4a26-aa79-52dff627ce7d-attachment.json)

**خطوات الفشل المسجلة:** Expect "soft toContainText".

### LUX-002 — تصدير تقرير المبيعات يحتوي أعمدة إضافية بلا أسماء

**الخطورة/الأولوية المقترحة:** متوسط — P1. **الحالة:** أُعيد إنتاج الفشل في هذا التشغيل.

**خطوات الإعادة:** Finance → Reports → Sales Invoice → Export → Export Excel. تكرار التصدير بعد تطبيق فلتر Customer.

**المتوقع:** ملف CSV بأسماء أعمدة غير فارغة وغير مكررة، دون أعمدة إضافية غير مقصودة، ويمكن مطابقة قيمه مع التقرير.

**الفعلي:** نجح التنزيل في الحالتين، لكن قارئ CSV رفض أسماء الأعمدة برسالة CSV requires unique nonempty column names. توجد أعمدة فارغة بعد Created At.

**حدود الدليل والمتابعة:** اختباران فاشلان لعطل واحد. التحقق توقف عند بنية الأعمدة؛ اختلاف حالات الدفع الذي لوحظ في تشغيل سابق لم يُتحقق منه مجددًا بعد هذه النقطة.

**ملف الاختبار:** `sales-report.spec.ts`.

**الأدلة:** [sales-invoice-export](../artifacts/full-suite/2026-09-30T15-02-29-221Z/b4256d38-6422-4ea4-9bc6-9f5537092145-attachment.csv) · [screenshot](../artifacts/full-suite/2026-09-30T15-02-29-221Z/d79b1581-60d2-463f-910e-243a4736a582-attachment.png) · [error-context](../artifacts/full-suite/2026-09-30T15-02-29-221Z/074ff58d-50e1-4947-add6-4b6b1bc8e3c8-attachment.md) · [finance-screen](../artifacts/full-suite/2026-09-30T15-02-29-221Z/ba2ab264-9969-4c22-b3ab-c2c49be02ad3-attachment.png) · [browser-diagnostics](../artifacts/full-suite/2026-09-30T15-02-29-221Z/e4557af2-7d68-4344-bde5-0017127c1a2f-attachment.json) · [sales-invoice-export](../artifacts/full-suite/2026-09-30T15-02-29-221Z/7488bf26-845c-4ad4-a25c-14ac343d6e9e-attachment.csv) · [screenshot](../artifacts/full-suite/2026-09-30T15-02-29-221Z/82fedb43-6b0f-4f1a-b9ca-312ff310908b-attachment.png) · [error-context](../artifacts/full-suite/2026-09-30T15-02-29-221Z/1cc16751-7d56-4dc0-9673-b045e3eeaeaa-attachment.md) · [finance-screen](../artifacts/full-suite/2026-09-30T15-02-29-221Z/b71d31cf-3ef5-4e89-9aed-76cafbebf315-attachment.png) · [browser-diagnostics](../artifacts/full-suite/2026-09-30T15-02-29-221Z/856897b5-d055-4dd8-afa2-2c9ffc6b5454-attachment.json)

### LUX-003 — الفئة الجديدة لا تظهر مختارة في نموذج المنتج العربي

**الخطورة/الأولوية المقترحة:** متوسط — P2. **الحالة:** أُعيد إنتاج الفشل في هذا التشغيل.

**خطوات الإعادة:** فتح إنشاء منتج بالعربية → الفئة → إنشاء جديد → إدخال اسم ورمز فئة فريدين → إرسال.

**المتوقع:** اختيار اسم الفئة الجديدة مباشرة وظهوره داخل حقل الفئة.

**الفعلي:** طلب إنشاء الفئة نجح وأُغلقت النافذة، لكن قيمة حقل الفئة بقيت فارغة خلال 10 ثوانٍ.

**حدود الدليل والمتابعة:** نفس سيناريو الواجهة الإنجليزية نجح. خطوة إعادة فتح القائمة والتحقق من بقاء الفئة لم تُنفذ بعد فشل الاختيار، فلا تُستنتج خسارة الفئة من قاعدة البيانات.

**ملف الاختبار:** `product-category-ar.spec.ts`.

**الأدلة:** [screenshot](../artifacts/full-suite/2026-09-30T15-02-29-221Z/d8579123-255a-4cf2-a58e-5d58cc22894d-attachment.png) · [error-context](../artifacts/full-suite/2026-09-30T15-02-29-221Z/82e5a572-7e40-4426-9378-27cd1ff8dfeb-attachment.md) · [browser-diagnostics](../artifacts/full-suite/2026-09-30T15-02-29-221Z/671b4d28-6b28-4400-b32d-f451d178966e-attachment.json)

**خطوات الفشل المسجلة:** Expect "toHaveValue".

### LUX-004 — زر الترجمة غير موجود في نافذة إضافة دولة

**الخطورة/الأولوية المقترحة:** منخفض — P2. **الحالة:** أُعيد إنتاج الفشل في هذا التشغيل.

**خطوات الإعادة:** Business partners → إنشاء مشروع → Country → Create new.

**المتوقع:** إتاحة إجراء Translation/Language لفتح حقل الاسم العربي حسب متطلب الاختبار.

**الفعلي:** عنوان Add Country وحقل Country Name موجودان، لكن النافذة تعرض close وSubmit وCancel فقط، ولا يوجد إجراء الترجمة المطلوب.

**حدود الدليل والمتابعة:** الفشل يخص غياب الإجراء؛ العنوان وتسمية الحقل اجتازا الاختبار. أولوية المتطلب تُراجع مع مسؤول المنتج.

**ملف الاختبار:** `country-modal.spec.ts`.

**الأدلة:** [screenshot](../artifacts/full-suite/2026-09-30T15-02-29-221Z/557c2371-be5d-4a71-801b-eaf3d623f402-attachment.png) · [error-context](../artifacts/full-suite/2026-09-30T15-02-29-221Z/84dd0690-6194-47ed-ba1b-02785e85cffd-attachment.md) · [browser-diagnostics](../artifacts/full-suite/2026-09-30T15-02-29-221Z/23a91f4d-3e58-49c8-a32c-aa22bc677299-attachment.json)

**خطوات الفشل المسجلة:** Expect "toBeEnabled".

### LUX-005 — تحويل طلب المواد لا يعبّئ الوحدة وسعر الشراء والإجمالي

**الخطورة/الأولوية المقترحة:** مرتفع — P1. **الحالة:** أُعيد إنتاج الفشل في هذا التشغيل.

**خطوات الإعادة:** إنشاء Material Request للمنتج gold بكمية 20 → حفظ → Convert to order → انتظار اكتمال تحميل نموذج أمر الشراء.

**المتوقع:** نقل بيانات الصنف والوحدة والكمية والسعر المتوقع وفق إعدادات المنتج، وحساب صافي موجب.

**الفعلي:** المنتج gold والكمية 20 انتقلا، لكن الوحدة فارغة وسعر الشراء 0 والصافي 0؛ فشلت التأكيدات الثلاثة.

**حدود الدليل والمتابعة:** الاختبار يفترض أن بيانات المنتج الأساسية تحتوي وحدة وسعرًا موجبًا، لكنه لا يقرأ Product Master في هذا التشغيل. يلزم التحقق من الإعدادات قبل الجزم بأن السبب فقد بيانات في التحويل. أمر الشراء لم يُحفظ؛ طلب المواد التجريبي أُنشئ.

**ملف الاختبار:** `material-request-to-order.spec.ts`.

**الأدلة:** [screenshot](../artifacts/full-suite/2026-09-30T15-02-29-221Z/8e76bc6b-16dd-4d87-a2cc-cf1bb7347b87-attachment.png) · [error-context](../artifacts/full-suite/2026-09-30T15-02-29-221Z/79b3c094-e48e-482a-afc5-d7b6362688fe-attachment.md) · [browser-diagnostics](../artifacts/full-suite/2026-09-30T15-02-29-221Z/2992148f-5424-46f1-a2fe-b3fe4a3f7073-attachment.json)

**خطوات الفشل المسجلة:** UOM was not populated؛ Purchase price was not populated؛ Net total must be positive after conversion.

### LUX-006 — إجراء Preview للموظف يفتح صفحة Edit

**الخطورة/الأولوية المقترحة:** متوسط — P2. **الحالة:** أُعيد إنتاج الفشل في هذا التشغيل.

**خطوات الإعادة:** إنشاء موظف تجريبي → قائمة الموظفين → قائمة الإجراءات → Preview.

**المتوقع:** فتح صفحة تفاصيل للقراءة فقط.

**الفعلي:** Preview يوجّه إلى مسار /employees/edit/ ويعرض نموذجًا قابلًا للتعديل.

**حدود الدليل والمتابعة:** لا يثبت ذلك تجاوز صلاحيات. الاختبار يستخدم soft assertion ويكمل التعديل والتصدير؛ راجع قائمة الأخطاء إذا ظهرت أعطال إضافية في الخطوات اللاحقة. الموظف التجريبي يبقى بعد الاختبار.

**ملف الاختبار:** `employee-lifecycle.spec.ts`.

**الأدلة:** [employee-preview](../artifacts/full-suite/2026-09-30T15-02-29-221Z/bd075825-39a1-4f81-a0c7-ecc5ba5089aa-attachment.png) · [screenshot](../artifacts/full-suite/2026-09-30T15-02-29-221Z/b0333fa2-4be0-4e38-ba70-79519d83c99f-attachment.png) · [error-context](../artifacts/full-suite/2026-09-30T15-02-29-221Z/ebc870b6-824d-469f-82ef-467503d5e6cc-attachment.md) · [browser-diagnostics](../artifacts/full-suite/2026-09-30T15-02-29-221Z/a41c17e1-320f-45c6-9991-655a07799d7f-attachment.json)

**خطوات الفشل المسجلة:** Preview must open a read-only employee details page.

## أخطاء المتصفح والتشغيل

### LUX-007 — استجابات HTTP غير ناجحة أثناء التنقل

**الخطورة المقترحة: مرتفع — P1** للاستجابات 500؛ السبب غير محدد من اختبارات الواجهة. قد تظهر الصفحة رغم الاستجابة غير الناجحة بسبب عرض الواجهة على العميل، لذلك نجاح سيناريو لا يعني خلوه من أخطاء الخادم. الأعداد التالية أحداث مرصودة وليست زيارات فريدة أو أعطال مستقلة.

| الاستجابة والمسار | مرات الرصد | عدد الاختبارات المتأثرة |
|---|---:|---:|
| 500 https://luxora.poweritech.com/en/contacts/contacts/create | 2 | 2 |
| 500 https://luxora.poweritech.com/en/contacts/contacts | 5 | 1 |
| 500 https://luxora.poweritech.com/en/contacts/contacts/54 | 1 | 1 |
| 500 https://luxora.poweritech.com/en/contacts/customers/create | 1 | 1 |
| 500 https://luxora.poweritech.com/en/finance/sales-invoices/invoices | 1 | 1 |
| 500 https://luxora.poweritech.com/en/finance/financial-statement/reports/sales-invoice-report | 4 | 4 |
| 500 https://luxora.poweritech.com/en/finance/financial-statement/trial-balance | 1 | 1 |
| 500 https://luxora.poweritech.com/ar/finance/inventory/inventory-managment/products-services/create | 1 | 1 |
| 500 https://luxora.poweritech.com/en/finance/inventory/inventory-managment/products-services/create | 1 | 1 |
| 500 https://luxora.poweritech.com/en/contacts/projects/create | 1 | 1 |
| 500 https://luxora.poweritech.com/en/finance/purchase-invoices/request-material/create | 1 | 1 |
| 500 https://luxora.poweritech.com/en/finance/purchase-invoices/request-material | 1 | 1 |
| 500 https://luxora.poweritech.com/en/finance/purchase-invoices/orders/create | 1 | 1 |
| 500 https://luxora.poweritech.com/en/finance/sales-invoices/invoices/create | 1 | 1 |
| 500 https://luxora.poweritech.com/en/users/system-admin | 3 | 3 |
| 500 https://luxora.poweritech.com/en/users/employees/create | 3 | 3 |
| 500 https://luxora.poweritech.com/en/users/permissions | 3 | 3 |
| 500 https://luxora.poweritech.com/en/users/permissions/52 | 3 | 1 |
| 500 https://luxora.poweritech.com/en/users/employees | 4 | 3 |

### ملاحظة بيئة — صلاحية إشعارات Firebase محظورة

ظهر `messaging/permission-blocked` 31 مرة في جلسات المتصفح. هذه ملاحظة صلاحية/تهيئة للمتصفح، ولا تثبت عطلًا في المحاسبة أو إرسال إشعارات لحساب مسموح له. لم نمنح صلاحية الإشعارات تلقائيًا.

### بقية الرسائل المسجلة

| النوع | الرسالة | مرات الرصد |
|---|---|---:|
| console.error | Failed to load resource: the server responded with a status of 500 () | 38 |

رسالة Node الخاصة بتعارض NO_COLOR وFORCE_COLOR تخص ألوان إخراج مشغّل الاختبار، ولا تُصنّف عطلًا في Luxora.

## حدود التغطية والبيانات

- نتائج الفشل لا تعني أن كل خطوة داخل الاختبار فشلت؛ راجع خطوات Allure والمرفقات.
- بيانات الاختبار: جهة الاتصال #54 أُزيلت؛ قد تبقى الفئات وطلب المواد والموظف الذين أنشأتهم الاختبارات الحالية. اختبار الصلاحيات يستعيد الحالة الأصلية في finally ويؤكدها. لا تُحذف سجلات عمل فعلية.
- في ميزان المراجعة يوجد حسابا VAT payable وVat Tax EXP بلا كود ظاهر؛ أرصدتهما صفر، وشملهما فحص الحسابات. هذه ملاحظة جودة بيانات وليست عدم اتزان مثبتًا.
- بيانات المخزون والسعر تحتاج مراجعة قبل تثبيت السبب الجذري لعطل التحويل.
- اختلاف اسم شركة oto عن اسم Company profile ما زال غير محسوم؛ لم تُشغّل سيناريوهات مالية جديدة لإنشاء/ترحيل قيود أو إغلاق فترة.

## جميع نتائج التشغيل

| الاختبار | النتيجة |
|---|---|
| @regression file picker only accepts supported images and documents | passed |
| @e2e create, preview, export, edit, filter, and delete a contact | failed |
| @regression dropdown consumes wheel scrolling without moving the page | passed |
| @finance-unit CSV preserves quoted values, newlines, signs and empty fields | passed |
| @finance-unit CSV rejects malformed exports instead of losing columns | passed |
| currency, negative, Arabic and locale-specific amounts | passed |
| rejects malformed values, missing data and hidden rounding | passed |
| decimal sums and journals balance exactly | passed |
| RPT-01 supporting check: source invoice fields and complete report totals | passed |
| RPT-01 supporting check: customer filter, refresh and reset | passed |
| RPT-02 supporting check: unfiltered CSV matches visible invoice fields | failed |
| RPT-02 supporting check: customer-filtered CSV matches visible invoice fields | failed |
| @finance-readonly FIN-01 RPT-01 supporting check: complete trial balance arithmetic | passed |
| @regression newly created Arabic category is selected and remains available | failed |
| @smoke newly created category appears in the product form | passed |
| @regression modal has a title, field label, and working translation action | failed |
| @smoke product data is populated in a Purchase Order | failed |
| @smoke required business fields and sections are available | passed |
| @smoke required fields, transaction tabs, and totals are available | passed |
| @smoke user can sign in and open the application | passed |
| @smoke permission tree and summary load successfully | passed |
| @regression Finance expands and displays its permission branches | passed |
| @regression Select all updates the summary and can be restored without submitting | passed |
| @smoke required employee sections and fields are available | passed |
| @regression Area and City remain dependent on their parent address fields | passed |
| @e2e update, persist, and restore an employee permission group | passed |
| @e2e create, preview, update, and export an employee | failed |
| @smoke employee list, statistics, and actions load successfully | passed |
| @regression search returns the matching employee | passed |
| @smoke users and role columns load successfully | passed |
| @regression search finds the current user and displays the assigned role | passed |
