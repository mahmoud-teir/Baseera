/**
 * Console copy — the `S` table from `Baseerah Dashboard.dc.html`, verbatim. Keys marked
 * «added» are not in the design. They cover states the static prototype never reaches: signed out,
 * no staff role, server errors and loading.
 */
export type Lang = 'en' | 'ar';
export type Role = 'content' | 'scholar' | 'mod' | 'analytics' | 'admin';
export type ViewId =
  | 'queue'
  | 'overview'
  | 'lessons'
  | 'evidence'
  | 'catalog'
  | 'library'
  | 'reports'
  | 'inbox'
  | 'scholars'
  | 'learners'
  | 'certs'
  | 'prayer'
  | 'roles'
  | 'updates';
export type Section = 'work' | 'content' | 'feedback' | 'people' | 'system';

export const ROLES: Role[] = ['content', 'scholar', 'mod', 'analytics', 'admin'];

export const VIEWS: { id: ViewId; sec: Section; roles: Role[] }[] = [
  { id: 'queue', sec: 'work', roles: ['content', 'scholar', 'mod', 'analytics', 'admin'] },
  { id: 'overview', sec: 'work', roles: ['content', 'analytics', 'admin'] },
  { id: 'lessons', sec: 'content', roles: ['content', 'admin'] },
  { id: 'evidence', sec: 'content', roles: ['content', 'scholar', 'admin'] },
  // added: every other content slot of the app (stories, encyclopedia, adhkar, tafsir, tajweed, paths, map, quotes, pages)
  { id: 'catalog', sec: 'content', roles: ['content', 'scholar', 'admin'] },
  { id: 'library', sec: 'content', roles: ['content', 'scholar', 'admin'] },
  { id: 'reports', sec: 'feedback', roles: ['content', 'mod', 'admin'] },
  // added: «تواصل معنا» messages
  { id: 'inbox', sec: 'feedback', roles: ['mod', 'admin'] },
  { id: 'scholars', sec: 'people', roles: ['scholar', 'admin'] },
  { id: 'learners', sec: 'people', roles: ['analytics', 'admin'] },
  { id: 'certs', sec: 'people', roles: ['analytics', 'admin'] },
  { id: 'prayer', sec: 'system', roles: ['admin'] },
  { id: 'roles', sec: 'system', roles: ['admin'] },
  { id: 'updates', sec: 'system', roles: ['admin'] },
];
export const VIEW_IDS = VIEWS.map((v) => v.id);

/** Permission matrix (rows = PERMS, columns = ROLES) — mirrored by `public.has_perm` in SQL. */
export const MATRIX: Record<Role, number[]> = {
  content: [1, 1, 0, 0, 0, 0],
  scholar: [1, 0, 1, 0, 0, 0],
  mod: [1, 0, 0, 1, 0, 0],
  analytics: [1, 0, 0, 0, 1, 0],
  admin: [1, 1, 1, 1, 1, 1],
};

export const METHODS = ['Automatic', 'Muslim World League', 'Umm al-Qura', 'Egyptian General Authority', 'Karachi', 'ISNA'] as const;

const en = {
  brand: 'Baseerah Console', langBtn: 'العربية', search: 'Search', searchPh: 'Jump to a screen or item…', notif: 'Alerts',
  work: 'Work', content: 'Content', feedback: 'Feedback', people: 'People', system: 'System',
  queue: 'Work queue', overview: 'Overview', lessons: 'Lessons', evidence: 'Evidence', library: 'Library & audio', reports: 'Error reports', scholars: 'Scholars', learners: 'Learners', certs: 'Certificates', prayer: 'Prayer & calendar', roles: 'Roles & audit', updates: 'App Updates & APK',
  overviewSub: 'What needs attention across the app.', weekly: 'Lessons completed this week', pipeline: 'Content pipeline',
  queueSub: 'Everything waiting on a person, newest first.', evSub: 'Each card moves Draft → Scholar review → Approved.', rpSub: 'Each report moves New → Triaged → Fixed → Learner notified.',
  all: 'All', mineOnly: 'Only my role', exportBtn: 'Export CSV / JSON', selected: 'selected', bulkAdv: 'Advance', clear: 'Clear', empty: 'Nothing waiting here.', pick: 'Select an item to review.', history: 'History', approvals: 'Approvals',
  kEv: 'Evidence', kRp: 'Report', kLs: 'Lesson',
  evS: ['Draft', 'Scholar review', 'Approved'], rpS: ['New', 'Triaged', 'Fixed', 'Notified'], lsS: ['Draft', 'In review', 'Published'], rejected: 'Rejected',
  toReview: 'Send to scholar', approve: 'Approve', reject: 'Reject', reopen: 'Reopen as draft', triage: 'Triage', fixed: 'Mark fixed', notify: 'Notify learner', submitReview: 'Submit for review', approveAs: 'Approve as',
  fSource: 'Source type', fRef: 'Reference', fText: 'Verified text', fCat: 'Category', fPara: 'Paragraph', fNote: 'Reporter note', fFix: 'Fix applied', textPh: 'Awaiting verified text', refPh: 'Not provided', srcPh: 'Not set',
  lessonsSub: 'Edit, compare and preview the lesson data that feeds the app.', exportLessons: 'Export lessons.json', fTitle: 'Title', fObj: 'Objectives', fSections: 'Explanation sections', fPass: 'Pass threshold', pending: 'Pending review', lessonWord: 'Lesson', tEdit: 'Edit', tDiff: 'Changes', tPrev: 'Phone preview',
  verifyCode: 'Verify a certificate code', verify: 'Verify', valid: 'Valid — issued by Baseerah.', invalid: 'No certificate with this code.',
  prayerSub: 'Defaults the app uses before a user changes them.', method: 'Calculation method', hijriAdj: 'Hijri date adjustment (days)', tNtf: 'Prayer notifications on by default', tHl: 'High-latitude rule', tDst: 'Follow daylight saving',
  audit: 'Audit log', auditEmpty: 'No changes yet. Every action you take is recorded here.',
  nApprove: 'Lesson 3 needs one more approval', nReport: 'New error report in Lesson 2', nEv: 'Evidence card waiting for scholar',
  cols: { scholars: ['Reviewer', 'Specialty', 'Pending', 'Reviewed', 'Status'], library: ['Item', 'Type', 'Category', 'Source', 'Status'], learners: ['Lesson', 'Learners', 'Avg. progress', 'Pass rate'], certs: ['Code', 'Learner', 'Issued', 'Status'], roles: ['Permission', 'Content', 'Scholar', 'Moderator', 'Analytics', 'Admin'] } as Record<string, string[]>,
  tt: { scholars: 'Scholars & reviewers', library: 'Library & audio' } as Record<string, string>,
  ts: { scholars: 'Add reviewers and their accreditations here.', library: 'Covers and recordings stay empty until uploaded.', learners: 'Progress grouped by lesson.', certs: 'Issued certificates and codes.', roles: 'Who can do what. Switch role above to preview.' } as Record<string, string>,
  perms: ['View lists', 'Edit lessons', 'Approve evidence', 'Triage reports', 'View analytics', 'Manage roles'],
  kpi: ['Evidence pending scholar', 'Open reports', 'Lessons pending approval', 'Active learners', 'Completed lessons', 'Quiz average'],
  kpiS: ['Live count', 'Live count', 'Needs 2 approvals', 'Last 30 days', 'All lessons', 'Pass mark 70%'],
  roleN: { content: 'Content team', scholar: 'Scholar reviewer', mod: 'Moderator', analytics: 'Analytics', admin: 'Admin' } as Record<Role, string>,
  status: { await: 'Awaiting content', active: 'Active', notSet: 'Not set', issued: 'Issued', pend: 'Pending' } as Record<string, string>,
  days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  needOneMore: (t: string) => `${t} needs one more approval`,
  newReport: (w: string) => `New report in ${w}`,
  signInTitle: 'Staff sign-in required', signInBody: 'Sign in with a staff account to access the console.', signIn: 'Sign in',
  noAccessTitle: 'No staff role', noAccessBody: 'This account has no staff role assigned yet.',
  loadFail: 'Failed to load console data.', retry: 'Retry', saved: 'Saved', failed: 'Server rejected this action', backToApp: 'Back to app',
  previewOnly: 'Preview only — the server enforces your real role.',
  live: 'Live', drafted: 'Draft saved',
  none: '—', book: 'Book', audio: 'Audio', yes: 'Yes', no: 'No', published: 'Published', unpublished: 'Unpublished',
  deleted: 'Deleted', created: 'Created', notConnectedTitle: 'Backend not connected', notConnectedBody: 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to use the console.',
  catalog: 'Content catalog', catalogSub: 'All content slots across the app.',
  inbox: 'Contact messages', inboxSub: 'Messages sent via «Contact us» in the app.',
  librarySub: 'Books and recordings. Must be approved with a source before appearing in the app.',
  saveDraft: 'Save draft', newItem: 'New', edit: 'Edit', cancel: 'Cancel', remove: 'Remove', add: 'Add', up: 'Up', down: 'Down', upload: 'Upload file', urlPh: 'https://…',
  notStarted: 'Not started', liveVersion: 'A published version exists; this draft replaces it on approval.', unsaved: 'Unsaved changes',
  newEvidence: 'New evidence', lessonCode: 'Lesson', addBook: 'Add book', addAudio: 'Add audio', newQuote: 'New quote', deleteItem: 'Delete', confirmDelete: 'Press again to delete',
  kinds: { lesson: 'Lesson', evidence: 'Evidence', quote: 'Quote', vocab: 'Quran vocabulary', story: 'Seerah', sharia: 'Encyclopedia', adhkar: 'Adhkar', tafsir: 'Tafsir', tajweed: 'Tajweed', drill: 'Listening drill', path: 'Path', map: 'Knowledge map', page: 'Page', book: 'Book', audio: 'Recording' } as Record<string, string>,
  f: {
    title: 'Title', minutes: 'Minutes', audio: 'Audio explanation', objectives: 'Objectives', sections: 'Explanation sections', heading: 'Section heading', body: 'Body', summary: 'Summary points',
    passPct: 'Pass mark (%)', questions: 'Quiz questions', q: 'Question', options: 'Options', answer: 'Correct answer', explain: 'Explanation', kind: 'Kind', label: 'Label', text: 'Verified text',
    source: 'Source', ref: 'Reference', wajh: 'Reasoning', chain: 'Evidence chain', level: 'Strength', reviewers: 'Reviewers', reviewedAt: 'Review date',
    cat: 'Category', scholar: 'Scholar', items: 'Items', count: 'Count', virtue: 'Virtue', tafsir: 'Tafsir', ayahs: 'Ayahs', ayah: 'Ayah',
    examples: 'Examples', steps: 'Steps', stepKind: 'Step type', target: 'Opens (app route)', links: 'Links', category: 'Category', author: 'Author', pages: 'Pages', chapters: 'Chapters',
    chapterTitle: 'Chapter title', paragraphs: 'Paragraphs', audioUrl: 'Audio file', sizeMb: 'Size (MB)', item: 'Item',
  } as Record<string, string>,
  team: 'Team', teamSub: 'Staff accounts and their roles. Members must first create an account in the app.', email: 'Email', role: 'Role', addMember: 'Add or change', you: 'you',
  addReviewer: 'Add reviewer', name: 'Name', subject: 'Subject', showPublic: 'Shown on «Scholarly supervision»', lastReview: 'Last review (YYYY-MM-DD)',
  fbStatus: { new: 'New', read: 'Read', done: 'Done' } as Record<string, string>, contact: 'Contact', markRead: 'Mark read', markDone: 'Mark done',
  curriculum: 'Curriculum', curriculumSub: 'Planned lessons per subject (stage 1) and the default pass mark. Certificates require every planned lesson.', planned: 'Planned lessons', passMark: 'Default pass mark (%)',
  errors: {
    forbidden: 'your role cannot do this', invalid_transition: 'not allowed in this state', already_approved: 'you already approved this', source_required: 'every text needs its source first',
    lesson_incomplete: 'add objectives, sections and at least one question first', question_invalid: 'a question needs 2–6 options and a correct answer', question_id: 'question ids must be unique',
    pass_pct: 'pass threshold must be 50–100', bad_slot: 'invalid slot', title_required: 'title is required', last_admin: 'there must be at least one admin', no_such_user: 'no account with this email',
    empty: 'nothing to publish yet', item_id: 'item ids must be unique', not_found: 'not found', invalid_config: 'invalid values',
  } as Record<string, string>,
};

type Strings = typeof en;

const ar: Strings = {
  brand: 'لوحة بصيرة', langBtn: 'English', search: 'بحث', searchPh: 'انتقل إلى شاشة أو عنصر…', notif: 'تنبيهات',
  work: 'العمل', content: 'المحتوى', feedback: 'الملاحظات', people: 'الأشخاص', system: 'النظام',
  queue: 'قائمة العمل', overview: 'نظرة عامة', lessons: 'الدروس', evidence: 'الأدلة', library: 'المكتبة والصوتيات', reports: 'بلاغات الأخطاء', scholars: 'العلماء', learners: 'المتعلمون', certs: 'الشهادات', prayer: 'الصلاة والتقويم', roles: 'الأدوار والسجل', updates: 'إدارة التحديثات والـ APK',
  overviewSub: 'ما يحتاج انتباهك في التطبيق.', weekly: 'الدروس المكتملة هذا الأسبوع', pipeline: 'مسار المحتوى',
  queueSub: 'كل ما ينتظر شخصًا، الأحدث أولًا.', evSub: 'تنتقل كل بطاقة: مسودة ← مراجعة عالم ← معتمدة.', rpSub: 'ينتقل كل بلاغ: جديد ← مصنّف ← أُصلح ← أُبلغ المتعلم.',
  all: 'الكل', mineOnly: 'دوري فقط', exportBtn: 'تصدير CSV / JSON', selected: 'محدد', bulkAdv: 'تقدّم', clear: 'مسح', empty: 'لا شيء بانتظارك هنا.', pick: 'اختر عنصرًا للمراجعة.', history: 'السجل', approvals: 'الموافقات',
  kEv: 'دليل', kRp: 'بلاغ', kLs: 'درس',
  evS: ['مسودة', 'مراجعة عالم', 'معتمد'], rpS: ['جديد', 'مصنّف', 'مُصلح', 'أُبلغ'], lsS: ['مسودة', 'قيد المراجعة', 'منشور'], rejected: 'مرفوض',
  toReview: 'إرسال إلى عالم', approve: 'اعتماد', reject: 'رفض', reopen: 'إعادة كمسودة', triage: 'تصنيف', fixed: 'تم الإصلاح', notify: 'إبلاغ المتعلم', submitReview: 'إرسال للمراجعة', approveAs: 'اعتماد باسم',
  fSource: 'نوع المصدر', fRef: 'المرجع', fText: 'النص الموثّق', fCat: 'التصنيف', fPara: 'الفقرة', fNote: 'ملاحظة المبلّغ', fFix: 'الإصلاح المطبّق', textPh: 'بانتظار نص موثّق', refPh: 'غير مُدخل', srcPh: 'غير محدد',
  lessonsSub: 'حرّر وقارن وعاين بيانات الدروس التي يقرأها التطبيق.', exportLessons: 'تصدير lessons.json', fTitle: 'العنوان', fObj: 'الأهداف', fSections: 'أقسام الشرح', fPass: 'حد النجاح', pending: 'بانتظار المراجعة', lessonWord: 'الدرس', tEdit: 'تحرير', tDiff: 'التغييرات', tPrev: 'معاينة الهاتف',
  verifyCode: 'تحقق من رمز شهادة', verify: 'تحقق', valid: 'صالحة — صادرة من بصيرة.', invalid: 'لا توجد شهادة بهذا الرمز.',
  prayerSub: 'القيم الافتراضية قبل أن يغيّرها المستخدم.', method: 'طريقة الحساب', hijriAdj: 'تعديل التاريخ الهجري (أيام)', tNtf: 'تنبيهات الصلاة مفعّلة افتراضيًا', tHl: 'قاعدة خطوط العرض العليا', tDst: 'اتباع التوقيت الصيفي',
  audit: 'سجل التدقيق', auditEmpty: 'لا تغييرات بعد. يُسجَّل هنا كل إجراء تقوم به.',
  nApprove: 'الدرس ٣ يحتاج موافقة إضافية', nReport: 'بلاغ جديد في الدرس ٢', nEv: 'دليل بانتظار عالم',
  cols: { scholars: ['المراجع', 'التخصص', 'قيد الانتظار', 'تمت مراجعته', 'الحالة'], library: ['العنصر', 'النوع', 'التصنيف', 'المصدر', 'الحالة'], learners: ['الدرس', 'المتعلمون', 'متوسط التقدم', 'نسبة النجاح'], certs: ['الرمز', 'المتعلم', 'الإصدار', 'الحالة'], roles: ['الصلاحية', 'المحتوى', 'العالم', 'المشرف', 'التحليلات', 'المدير'] },
  tt: { scholars: 'العلماء والمراجعون', library: 'المكتبة والصوتيات' },
  ts: { scholars: 'تضيف أنت هويات المراجعين وإجازاتهم.', library: 'تبقى الأغلفة والصوتيات والقرّاء فارغة حتى توفّرها.', learners: 'التقدم حسب الدرس.', certs: 'الشهادات الصادرة ورموز التحقق.', roles: 'من يستطيع فعل ماذا. بدّل الدور من الشريط العلوي للمعاينة.' },
  perms: ['عرض القوائم', 'تحرير الدروس', 'اعتماد الأدلة', 'تصنيف البلاغات', 'عرض التحليلات', 'إدارة الأدوار'],
  kpi: ['أدلة بانتظار عالم', 'بلاغات مفتوحة', 'دروس بانتظار الموافقة', 'متعلمون نشطون', 'إكمال الدروس', 'متوسط الاختبارات'],
  kpiS: ['عدّ مباشر', 'عدّ مباشر', 'تحتاج موافقتين', 'آخر ٣٠ يومًا', 'كل الدروس', 'حد النجاح ٧٠٪'],
  roleN: { content: 'فريق المحتوى', scholar: 'مراجع عالم', mod: 'مشرف', analytics: 'التحليلات', admin: 'مدير عام' },
  status: { await: 'بانتظار المحتوى', active: 'نشط', notSet: 'غير محدد', issued: 'صادرة', pend: 'قيد الانتظار' },
  days: ['س', 'أ', 'إ', 'ث', 'ر', 'خ', 'ج'],
  needOneMore: (t: string) => `${t} يحتاج موافقة إضافية`,
  newReport: (w: string) => `بلاغ جديد في ${w}`,
  signInTitle: 'يلزم دخول فريق العمل', signInBody: 'سجّل الدخول بحساب من فريق العمل لفتح اللوحة.', signIn: 'تسجيل الدخول',
  noAccessTitle: 'لا صلاحية للوحة', noAccessBody: 'هذا الحساب بلا دور في فريق العمل. يستطيع المدير منحه من جدول الفريق.',
  loadFail: 'تعذّر تحميل بيانات اللوحة.', retry: 'إعادة المحاولة', saved: 'حُفظ', failed: 'رفض الخادم هذا الإجراء', backToApp: 'العودة إلى التطبيق',
  previewOnly: 'معاينة فقط — يطبّق الخادم دورك الحقيقي.',
  live: 'مباشر', drafted: 'حُفظت المسودة',
  none: '—', book: 'كتاب', audio: 'صوتي', yes: 'نعم', no: 'لا', published: 'منشور', unpublished: 'غير منشور',
  deleted: 'حُذف', created: 'أُنشئ', notConnectedTitle: 'الخادم غير متصل', notConnectedBody: 'اضبط EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY لاستخدام اللوحة. تعرض اللوحة بيانات حقيقية فقط.',
  catalog: 'فهرس المحتوى', catalogSub: 'كل خانات المحتوى في التطبيق. الخانة الفارغة تظهر للمتعلم «بانتظار التوثيق» حتى تُنشر.',
  inbox: 'رسائل التواصل', inboxSub: 'الرسائل المرسلة من «تواصل معنا» في التطبيق.',
  librarySub: 'الكتب والتسجيلات. لا يظهر شيء في التطبيق قبل اعتماد عالم مع المصدر.',
  saveDraft: 'حفظ المسودة', newItem: 'جديد', edit: 'تحرير', cancel: 'إلغاء', remove: 'إزالة', add: 'إضافة', up: 'أعلى', down: 'أسفل', upload: 'رفع ملف', urlPh: 'https://…',
  notStarted: 'لم يبدأ', liveVersion: 'توجد نسخة منشورة؛ تحل هذه المسودة محلها بعد الاعتماد.', unsaved: 'تغييرات غير محفوظة',
  newEvidence: 'دليل جديد', lessonCode: 'الدرس', addBook: 'إضافة كتاب', addAudio: 'إضافة تسجيل', newQuote: 'قول جديد', deleteItem: 'حذف', confirmDelete: 'اضغط مجددًا للحذف',
  kinds: { lesson: 'درس', evidence: 'دليل', quote: 'قول', vocab: 'مفردات القرآن', story: 'سيرة', sharia: 'الموسوعة', adhkar: 'أذكار', tafsir: 'تفسير', tajweed: 'تجويد', drill: 'تدريب الاستماع', path: 'مسار', map: 'خريطة المعرفة', page: 'صفحة', book: 'كتاب', audio: 'تسجيل' },
  f: {
    title: 'العنوان', minutes: 'المدة (دقائق)', audio: 'الشرح الصوتي', objectives: 'الأهداف', sections: 'أقسام الشرح', heading: 'العنوان الفرعي', body: 'النص', summary: 'نقاط الملخص',
    passPct: 'حد النجاح (%)', questions: 'أسئلة الاختبار', q: 'السؤال', options: 'الخيارات', answer: 'الخيار الصحيح', explain: 'التوضيح', kind: 'النوع', label: 'التسمية', text: 'النص الموثّق',
    source: 'المصدر', ref: 'المرجع', wajh: 'وجه الاستدلال', chain: 'شرح المسألة', level: 'مستوى الموثوقية', reviewers: 'المراجعون', reviewedAt: 'تاريخ المراجعة',
    cat: 'التصنيف', scholar: 'القائل', items: 'الأذكار', count: 'عدد التكرار', virtue: 'الفضل (اختياري)', tafsir: 'التفسير (المؤلف · الكتاب)', ayahs: 'تفسير الآيات', ayah: 'الآية',
    examples: 'أمثلة', steps: 'الخطوات', stepKind: 'نوع الخطوة', target: 'تفتح (مسار في التطبيق)', links: 'الروابط', category: 'التصنيف', author: 'المؤلف', pages: 'الصفحات', chapters: 'الفصول',
    chapterTitle: 'عنوان الفصل', paragraphs: 'الفقرات', audioUrl: 'الملف الصوتي', sizeMb: 'الحجم (م.ب)', item: 'عنصر',
  },
  team: 'الفريق', teamSub: 'حسابات فريق العمل وأدوارهم. ينشئ العضو حسابًا في التطبيق أولًا.', email: 'البريد', role: 'الدور', addMember: 'إضافة أو تغيير', you: 'أنت',
  addReviewer: 'إضافة مراجع', name: 'الاسم', subject: 'المادة', showPublic: 'يظهر في «الإشراف العلمي»', lastReview: 'آخر مراجعة (YYYY-MM-DD)',
  fbStatus: { new: 'جديدة', read: 'مقروءة', done: 'منجزة' }, contact: 'وسيلة التواصل', markRead: 'تعليم كمقروءة', markDone: 'تعليم كمنجزة',
  curriculum: 'خطة المنهج', curriculumSub: 'عدد الدروس المخطط لكل مادة (المرحلة الأولى) وحد النجاح الافتراضي. تتطلب الشهادة كل الدروس المخططة.', planned: 'الدروس المخططة', passMark: 'حد النجاح الافتراضي (%)',
  errors: {
    forbidden: 'دورك لا يسمح بهذا', invalid_transition: 'غير مسموح في هذه الحالة', already_approved: 'اعتمدته من قبل', source_required: 'يلزم المصدر لكل نص أولًا',
    lesson_incomplete: 'أضف الأهداف والأقسام وسؤالًا واحدًا على الأقل', question_invalid: 'يلزم كل سؤال 2–6 خيارات وإجابة صحيحة', question_id: 'معرّفات الأسئلة يجب ألا تتكرر',
    pass_pct: 'حد النجاح بين 50 و100', bad_slot: 'خانة غير صالحة', title_required: 'العنوان مطلوب', last_admin: 'يجب أن يبقى مدير واحد على الأقل', no_such_user: 'لا يوجد حساب بهذا البريد',
    empty: 'لا شيء للنشر بعد', item_id: 'معرّفات العناصر يجب ألا تتكرر', not_found: 'غير موجود', invalid_config: 'قيم غير صالحة',
  },
};

export const S: Record<Lang, Strings> = { en, ar };
export type L = Strings;
