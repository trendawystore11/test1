// =============================================================================
// seed-data.mjs — بيانات تجريبية ثابتة (deterministic) تُحقن في localStorage قبل
// التقاط لقطات الشاشة، لتصير الشاشات واقعية وقابلة للمقارنة بين نسخة وأخرى.
// الهدف: لقطات شاشة متطابقة تماماً في كل تشغيل (ثوابت فقط، بلا تواريخ حية).
// =============================================================================

export const PREFIX = 'bms_trendawy_'
export const STORAGE_VERSION = 'v2_clean'

// جلسة المدير (تُحقن في sessionStorage)
export const SESSION = {
  id: 'USR-1001',
  email: 'admin@store.com',
  name: 'المدير العام',
  role: 'admin',
  loginTime: '2026-07-28 09:00:00',
}

const DAY = '2026-07-28 10:00:00'

export const COLLECTIONS = {
  customers: [
    { id: 'CUST-0001', name: 'أحمد السيد محمد', phone: '01012345678', secondaryPhone: '01055551111', category: 'تاجر جملة', address: 'القاهرة، مدينة نصر، شارع عباس العقاد', notes: 'عميل أساسي لشحن المحافظات', ordersCount: 3, totalPurchases: 27480, paid: 22480, remainingBalance: 5000, creditBalance: 0, lastOrderDate: '2026-07-20 10:30:00', createdAt: '2026-07-01 09:00:00', updatedAt: '2026-07-20 10:30:00' },
    { id: 'CUST-0002', name: 'فاطمة الزهراء عبد الله', phone: '01198765432', secondaryPhone: '', category: 'تاجر تجزئة', address: 'الجيزة، الدقي، شارع التحرير', notes: '', ordersCount: 2, totalPurchases: 1180, paid: 500, remainingBalance: 680, creditBalance: 0, lastOrderDate: '2026-07-22 14:00:00', createdAt: '2026-07-05 11:00:00', updatedAt: '2026-07-22 14:00:00' },
    { id: 'CUST-0003', name: 'شركة النور للاستيراد والتصدير', phone: '01234567890', secondaryPhone: '01234009900', category: 'معرض / وكيل', address: 'الإسكندرية، سموحة، شارع أحمد شوقي', notes: 'تعامل نقدي بالكامل', ordersCount: 1, totalPurchases: 4600, paid: 1000, remainingBalance: 3600, creditBalance: 0, lastOrderDate: '2026-07-25 09:15:00', createdAt: '2026-07-10 10:00:00', updatedAt: '2026-07-25 09:15:00' },
    { id: 'CUST-0004', name: 'محمود إبراهيم حسن', phone: '01098765432', secondaryPhone: '', category: 'عميل قطاعي / فردي', address: 'القاهرة، المعادي، شارع 9', notes: '', ordersCount: 1, totalPurchases: 640, paid: 640, remainingBalance: 0, creditBalance: 0, lastOrderDate: '2026-07-18 12:45:00', createdAt: '2026-07-08 13:00:00', updatedAt: '2026-07-18 12:45:00' },
    { id: 'CUST-0005', name: 'خالد عبد الرحمن', phone: '01112223344', secondaryPhone: '', category: 'عميل محتمل', address: '', notes: 'طلب عرض سعر بطاطين فاخرة', ordersCount: 0, totalPurchases: 0, paid: 0, remainingBalance: 0, creditBalance: 0, lastOrderDate: null, createdAt: '2026-07-20 16:00:00', updatedAt: '2026-07-20 16:00:00' },
    { id: 'CUST-0006', name: 'جمعية البر والتقوى الخيرية', phone: '01000009999', secondaryPhone: '', category: 'جمعية خيرية / مؤسسة', address: 'المنصورة، وسط البلد', notes: 'خصم ثابت 5% للمؤسسات', ordersCount: 1, totalPurchases: 1980, paid: 0, remainingBalance: 1980, creditBalance: 0, lastOrderDate: '2026-07-28 16:20:00', createdAt: '2026-07-15 12:00:00', updatedAt: '2026-07-28 16:20:00' },
  ],
  suppliers: [
    { id: 'SUP-0001', name: 'مصنع النور للتطريز والمفروشات', phone: '01123456789', secondaryPhone: '', address: 'المحلة الكبرى، المنطقة الصناعية', notes: '', totalPurchases: 152000, paid: 125000, remainingBalance: 27000, createdAt: '2026-06-01 09:00:00', updatedAt: '2026-07-15 09:00:00' },
    { id: 'SUP-0002', name: 'شركة القطن المصري للنسيج', phone: '01234567891', secondaryPhone: '', address: 'طنطا، طريق طنطا كفر الزيات', notes: 'مورد القطن الخام', totalPurchases: 84500, paid: 84500, remainingBalance: 0, createdAt: '2026-06-10 10:00:00', updatedAt: '2026-07-10 10:00:00' },
    { id: 'SUP-0003', name: 'توكيل الأمل للبطاطين', phone: '01098765431', secondaryPhone: '01012340001', address: 'الإسكندرية، برج العرب', notes: '', totalPurchases: 38000, paid: 20000, remainingBalance: 18000, createdAt: '2026-06-20 11:00:00', updatedAt: '2026-07-20 11:00:00' },
    { id: 'SUP-0004', name: 'مصنع الصفا للنسريات والمستلزمات', phone: '01112223344', secondaryPhone: '', address: 'المنصورة، المنطقة الصناعية الجديدة', notes: '', totalPurchases: 12900, paid: 12900, remainingBalance: 0, createdAt: '2026-07-01 08:00:00', updatedAt: '2026-07-05 08:00:00' },
  ],
  products: [
    { id: 'PRD-0001', code: 'BTN-001', name: 'بطانية فرو سميك مقاس 150×200', category: 'بطاطين', purchasePrice: 350, sellingPrice: 550, stock: 120, minStock: 20, supplierId: 'SUP-0001', supplierName: 'مصنع النور للتطريز والمفروشات', createdAt: '2026-06-05 09:00:00', updatedAt: '2026-07-15 09:00:00' },
    { id: 'PRD-0002', code: 'WHT-010', name: 'شرشف كتان فرنساوي', category: 'مفروشات', purchasePrice: 220, sellingPrice: 380, stock: 8, minStock: 15, supplierId: 'SUP-0002', supplierName: 'شركة القطن المصري للنسيج', createdAt: '2026-06-05 09:05:00', updatedAt: '2026-07-16 09:00:00' },
    { id: 'PRD-0003', code: 'COV-020', name: 'لحاف شتوي مقاس كينج', category: 'لحف', purchasePrice: 480, sellingPrice: 750, stock: 45, minStock: 10, supplierId: 'SUP-0001', supplierName: 'مصنع النور للتطريز والمفروشات', createdAt: '2026-06-05 09:10:00', updatedAt: '2026-07-15 09:10:00' },
    { id: 'PRD-0004', code: 'MAT-004', name: 'غطاء مرتبة أطفال', category: 'مفروشات', purchasePrice: 120, sellingPrice: 200, stock: 0, minStock: 10, supplierId: 'SUP-0004', supplierName: 'مصنع الصفا للنسريات والمستلزمات', createdAt: '2026-06-06 09:00:00', updatedAt: '2026-07-17 09:00:00' },
    { id: 'PRD-0005', code: 'SIL-031', name: 'مفرش سرير حرير مطبوع', category: 'مفروشات', purchasePrice: 280, sellingPrice: 460, stock: 33, minStock: 12, supplierId: 'SUP-0002', supplierName: 'شركة القطن المصري للنسيج', createdAt: '2026-06-06 09:05:00', updatedAt: '2026-07-16 09:05:00' },
    { id: 'PRD-0006', code: 'PILL-090', name: 'مخدة دانتيل فاخر', category: 'مخدات', purchasePrice: 95, sellingPrice: 160, stock: 210, minStock: 30, supplierId: 'SUP-0003', supplierName: 'توكيل الأمل للبطاطين', createdAt: '2026-06-07 09:00:00', updatedAt: '2026-07-14 09:00:00' },
    { id: 'PRD-0007', code: 'WOOL-012', name: 'بطانية صوف عالية الكثافة', category: 'بطاطين', purchasePrice: 420, sellingPrice: 680, stock: 60, minStock: 15, supplierId: 'SUP-0001', supplierName: 'مصنع النور للتطريز والمفروشات', createdAt: '2026-06-07 09:05:00', updatedAt: '2026-07-15 09:05:00' },
    { id: 'PRD-0008', code: 'BAG-555', name: 'شنطة حفظ لحاف للتخزين', category: 'مستلزمات', purchasePrice: 40, sellingPrice: 90, stock: 3, minStock: 20, supplierId: 'SUP-0004', supplierName: 'مصنع الصفا للنسريات والمستلزمات', createdAt: '2026-06-08 09:00:00', updatedAt: '2026-07-18 09:00:00' },
  ],
  orders: [
    { id: 'ORD-1001', customerId: 'CUST-0001', customerName: 'أحمد السيد محمد', customerPhone: '01012345678', customerSecondaryPhone: '01055551111', status: 'delivered', totalAmount: 2750, downPayment: 2750, remainingBalance: 0, shippingDeposit: 150, shippingCost: 120, shippingPayer: 'customer', shippingRevenueDeposit: 120, items: [{ productId: 'PRD-0001', productName: 'بطانية فرو سميك مقاس 150×200', quantity: 5, price: 550 }], notes: '', createdAt: '2026-07-20 10:30:00', updatedAt: '2026-07-20 10:30:00' },
    { id: 'ORD-1002', customerId: 'CUST-0002', customerName: 'فاطمة الزهراء عبد الله', customerPhone: '01198765432', customerSecondaryPhone: '', status: 'confirmed', totalAmount: 1180, downPayment: 500, remainingBalance: 680, shippingDeposit: 0, items: [{ productId: 'PRD-0003', productName: 'لحاف شتوي مقاس كينج', quantity: 1, price: 750 }, { productId: 'PRD-0006', productName: 'مخدة دانتيل فاخر', quantity: 1, price: 160 }, { productId: 'PRD-0008', productName: 'شنطة حفظ لحاف للتخزين', quantity: 3, price: 90 }], notes: 'توصيل للدقي بعد أسبوع', createdAt: '2026-07-22 14:00:00', updatedAt: '2026-07-22 14:00:00' },
    { id: 'ORD-1003', customerId: 'CUST-0003', customerName: 'شركة النور للاستيراد والتصدير', customerPhone: '01234567890', customerSecondaryPhone: '01234009900', status: 'new', totalAmount: 4600, downPayment: 1000, remainingBalance: 3600, shippingDeposit: 0, items: [{ productId: 'PRD-0007', productName: 'بطانية صوف عالية الكثافة', quantity: 4, price: 680 }, { productId: 'PRD-0005', productName: 'مفرش سرير حرير مطبوع', quantity: 3, price: 460 }], notes: '', createdAt: '2026-07-25 09:15:00', updatedAt: '2026-07-25 09:15:00' },
    { id: 'ORD-1004', customerId: 'CUST-0004', customerName: 'محمود إبراهيم حسن', customerPhone: '01098765432', customerSecondaryPhone: '', status: 'completed', totalAmount: 640, downPayment: 640, remainingBalance: 0, items: [{ productId: 'PRD-0002', productName: 'شرشف كتان فرنساوي', quantity: 1, price: 380 }, { productId: 'PRD-0006', productName: 'مخدة دانتيل فاخر', quantity: 1, price: 160 }], notes: '', createdAt: '2026-07-18 12:45:00', updatedAt: '2026-07-18 12:45:00' },
    { id: 'ORD-1005', customerId: 'CUST-0006', customerName: 'جمعية البر والتقوى الخيرية', customerPhone: '01000009999', customerSecondaryPhone: '', status: 'new', totalAmount: 1980, downPayment: 0, remainingBalance: 1980, items: [{ productId: 'PRD-0001', productName: 'بطانية فرو سميك مقاس 150×200', quantity: 2, price: 550 }, { productId: 'PRD-0007', productName: 'بطانية صوف عالية الكثافة', quantity: 1, price: 680 }], notes: 'توصيل فرع المنصورة', createdAt: '2026-07-28 16:20:00', updatedAt: '2026-07-28 16:20:00' },
  ],
  payments: [
    { id: 'PAY-0001', entityType: 'customer', entityId: 'CUST-0001', entityName: 'أحمد السيد محمد', amount: 2000, date: '2026-07-20', paymentMethod: 'cash', notes: 'سداد دفعة أولى', isDownPayment: true, createdBy: 'المدير العام', createdAt: '2026-07-20 10:35:00', type: 'deposit', refOrderId: 'ORD-1001', cycleKey: '' },
    { id: 'PAY-0002', entityType: 'customer', entityId: 'CUST-0001', entityName: 'أحمد السيد محمد', amount: 750, date: '2026-07-21', paymentMethod: 'cash', notes: 'تحصيل باقي الفاتورة', isDownPayment: false, createdBy: 'المدير العام', createdAt: '2026-07-21 11:00:00', type: 'payment', refOrderId: 'ORD-1001', cycleKey: '' },
    { id: 'PAY-0003', entityType: 'customer', entityId: 'CUST-0002', entityName: 'فاطمة الزهراء عبد الله', amount: 500, date: '2026-07-22', paymentMethod: 'cash', notes: 'عربون', isDownPayment: true, createdBy: 'المدير العام', createdAt: '2026-07-22 14:05:00', type: 'deposit', refOrderId: 'ORD-1002', cycleKey: '' },
    { id: 'PAY-0004', entityType: 'customer', entityId: 'CUST-0003', entityName: 'شركة النور للاستيراد والتصدير', amount: 1000, date: '2026-07-25', paymentMethod: 'bank', notes: 'تحويل بنكي على الحساب', isDownPayment: true, createdBy: 'المدير العام', createdAt: '2026-07-25 09:20:00', type: 'deposit', refOrderId: 'ORD-1003', cycleKey: '' },
    { id: 'PAY-0005', entityType: 'customer', entityId: 'CUST-0004', entityName: 'محمود إبراهيم حسن', amount: 640, date: '2026-07-18', paymentMethod: 'cash', notes: '', isDownPayment: false, createdBy: 'المدير العام', createdAt: '2026-07-18 12:50:00', type: 'payment', refOrderId: 'ORD-1004', cycleKey: '' },
    { id: 'PAY-0006', entityType: 'supplier', entityId: 'SUP-0001', entityName: 'مصنع النور للتطريز والمفروشات', amount: 40000, date: '2026-07-15', paymentMethod: 'bank', notes: 'دفعة لشحنة البطاطين', isDownPayment: false, createdBy: 'المدير العام', createdAt: '2026-07-15 09:30:00', type: 'payment', refOrderId: '', cycleKey: '' },
    { id: 'PAY-0007', entityType: 'supplier', entityId: 'SUP-0003', entityName: 'توكيل الأمل للبطاطين', amount: 20000, date: '2026-07-20', paymentMethod: 'cash', notes: '', isDownPayment: false, createdBy: 'المدير العام', createdAt: '2026-07-20 12:00:00', type: 'payment', refOrderId: '', cycleKey: '' },
  ],
  expenses: [
    { id: 'EXP-0001', title: 'إيجار محل الفرع', amount: 9000, category: 'إيجارات', date: '2026-07-01', notes: 'إيجار شهري', recurring: true, dueDay: 1, createdBy: 'المدير العام', createdAt: '2026-07-01 09:00:00', updatedAt: '2026-07-01 09:00:00' },
    { id: 'EXP-0002', title: 'فاتورة كهرباء المحل', amount: 1450, category: 'كهرباء ومرافق', date: '2026-07-05', notes: '', recurring: false, dueDay: null, createdBy: 'المدير العام', createdAt: '2026-07-05 10:00:00', updatedAt: '2026-07-05 10:00:00' },
    { id: 'EXP-0003', title: 'مرتب كاشير فرع المعادي', amount: 3200, category: 'أجور ومرتبات', date: '2026-07-25', notes: 'شهري ثابت', recurring: true, dueDay: 25, createdBy: 'المدير العام', createdAt: '2026-07-25 11:00:00', updatedAt: '2026-07-25 11:00:00' },
    { id: 'EXP-0004', title: 'أكياس تغليف وطباعة كروت', amount: 850, category: 'تغليف ومطبوعات', date: '2026-07-18', notes: '', recurring: false, dueDay: null, createdBy: 'المدير العام', createdAt: '2026-07-18 13:00:00', updatedAt: '2026-07-18 13:00:00' },
    { id: 'EXP-0005', title: 'شحن بضاعة للمحافظات', amount: 2300, category: 'شحن ونقل', date: '2026-07-22', notes: 'توصيل طلبيات الدلتا', recurring: false, dueDay: null, createdBy: 'المدير العام', createdAt: '2026-07-22 15:00:00', updatedAt: '2026-07-22 15:00:00' },
  ],
  supplierReturns: [],
  supplierTransactions: [
    { id: 'STR-0001', supplierId: 'SUP-0001', supplierName: 'مصنع النور للتطريز والمفروشات', type: 'شحنة توريد', refId: 'PRD-0001', debit: 42000, credit: 0, note: 'توريد شحنة بطاطين فرو (120 قطعة × 350)', date: DAY },
    { id: 'STR-0002', supplierId: 'SUP-0001', supplierName: 'مصنع النور للتطريز والمفروشات', type: 'تسجيل منتج ومخزون', refId: 'PRD-0003', debit: 21600, credit: 0, note: 'إضافة منتج "لحاف شتوي مقاس كينج" للمخزون (45 قطعة × 480)', date: DAY },
    { id: 'STR-0003', supplierId: 'SUP-0003', supplierName: 'توكيل الأمل للبطاطين', type: 'شحنة توريد', refId: 'PRD-0006', debit: 19950, credit: 0, note: 'توريد شحنة مخدات دانتيل (210 قطعة × 95)', date: DAY },
    { id: 'STR-0004', supplierId: 'SUP-0001', supplierName: 'مصنع النور للتطريز والمفروشات', type: 'سداد مديونية', refId: '', debit: 0, credit: 40000, note: 'دفعة لشحنة البطاطين', date: DAY },
  ],
  users: [
    { id: 'USR-1001', name: 'المدير العام', email: 'admin@store.com', role: 'admin', createdAt: '2026-07-01T10:00:00Z', updatedAt: '2026-07-28 09:00:00' },
    { id: 'USR-1002', name: 'أحمد محمود الكاشير', email: 'ahmed@store.com', role: 'employee', createdAt: '2026-07-03T10:00:00Z', updatedAt: '2026-07-20 09:00:00' },
    { id: 'USR-1003', name: 'محمود سعيد أمين المخزن', email: 'mahmoud@store.com', role: 'storekeeper', createdAt: '2026-07-05T10:00:00Z', updatedAt: '2026-07-21 09:00:00' },
    { id: 'USR-1004', name: 'منى خالد المحاسبة', email: 'mona@store.com', role: 'accountant', createdAt: '2026-07-08T10:00:00Z', updatedAt: '2026-07-22 09:00:00' },
  ],
}

// القيم المطلوبة من getCairoFormattedDate — تُستخدم في الـ localStorage key
export function buildStoragePayload() {
  const payload = {
    [PREFIX + 'storage_version']: STORAGE_VERSION,
  }
  Object.entries(COLLECTIONS).forEach(([key, docs]) => {
    payload[PREFIX + 'data_' + key] = JSON.stringify(docs)
  })
  return payload
}
