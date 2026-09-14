/* Bilingual dictionary — Arabic (default) + English. Everything offline. */
const DICT = {
  ar:{
    app:'إيجل سوت', appsub:'نظام إدارة محل البدل الرجالية',
    invoice:'فاتورة بيع', inventory:'المخزون', customers:'العملاء',
    history:'سجل المبيعات', reports:'التقارير', settings:'الإعدادات', logout:'خروج',
    manager:'Osama', seller:'بائع', products:'الأصناف', expenses:'المصروفات',
    exp_no:'رقم المصروف', exp_cat:'النوع', exp_desc:'البيان', exp_payee:'المستلم',
    exp_amount:'المبلغ', exp_add:'إضافة مصروف', exp_total:'إجمالي المصروفات',
    exp_ops:'عملية', r_expenses:'تقرير المصروفات', net_income:'صافي الدخل',
    r_revenue:'تقرير الإيرادات',
    // generic
    new:'جديد', save:'حفظ', print:'طباعة', cancel:'إلغاء', search:'بحث', edit:'تعديل',
    del:'حذف', close:'إغلاق', add:'إضافة', export:'تصدير', confirm:'تأكيد', back:'رجوع',
    all:'الكل', from:'من تاريخ', to:'إلى تاريخ', total:'الإجمالي', apply:'عرض', reset:'تفريغ',
    yes:'نعم', no:'لا', none:'لا يوجد', actions:'إجراءات', seq:'م',
    // invoice
    inv_no:'رقم الفاتورة', inv_date:'التاريخ', cust_name:'اسم العميل', phone:'رقم الهاتف',
    seller:'البائع', paytype:'طريقة الدفع', items:'أصناف الفاتورة', suit:'اسم البدلة',
    category:'الفئة', color:'اللون', size:'المقاس', qty:'الكمية', price:'سعر الوحدة',
    disc:'الخصم', line_total:'الإجمالي', grand:'الإجمالي الكلي', paid:'المبلغ المدفوع',
    remain:'المبلغ المتبقي', notes:'ملاحظات', new_inv:'فاتورة جديدة', find_cust:'بحث عن عميل',
    subtotal:'إجمالي الأصناف', inv_disc:'خصم الفاتورة', addrow:'إضافة صنف', barcode:'باركود',
    // inventory / products
    buy_price:'سعر الشراء', sell_price:'سعر البيع', stock:'الكمية المتاحة', loc:'مكان التخزين',
    status:'الحالة', supplier:'المورد', avail:'متوفر', low:'غير متوفر', out:'غير متوفر',
    code:'الكود', profitm:'هامش الربح', value:'قيمة المخزون',
    // customers
    address:'العنوان', totalbuy:'إجمالي المشتريات', lastbuy:'آخر عملية شراء',
    purchist:'سجل مشتريات العميل', invcount:'عدد الفواتير', balance:'رصيد مستحق',
    // purchases
    pur_no:'رقم أمر الشراء', pur_date:'تاريخ التوريد', pur_sup:'المورد', pur_tot:'قيمة التوريد',
    // reports
    r_daily:'مبيعات اليوم', r_monthly:'المبيعات الشهرية', r_best:'الأكثر مبيعاً',
    r_stock:'المخزون الحالي', r_low:'أصناف غير متوفرة', r_cust:'مشتريات العملاء', r_profit:'تقرير الأرباح',
    revenue:'الإيرادات', cost:'التكلفة', profit:'صافي الربح', invoices:'الفواتير', pieces:'القطع',
    // settings
    st_store:'بيانات المحل', st_print:'طابعة الفاتورة', st_logo:'شعار الفاتورة',
    st_backup:'نسخة احتياطية', st_restore:'استعادة قاعدة البيانات', st_users:'المستخدمين',
    store_name:'اسم المحل', store_phone:'الهاتف', store_addr:'العنوان', currency:'العملة',
    tax:'نسبة الضريبة %', footer_txt:'تذييل الفاتورة', paper:'مقاس الورق', username:'اسم المستخدم',
    role:'الصلاحية', password:'كلمة المرور',
    // messages
    m_saved:'تم الحفظ بنجاح', m_deleted:'تم الحذف', m_noitems:'أضف صنفاً واحداً على الأقل',
    m_nocust:'من فضلك أدخل اسم العميل', m_stock:'الكمية المطلوبة غير متوفرة بالمخزون',
    m_conf_del:'هل تريد بالتأكيد حذف هذا السجل؟', m_inv_saved:'تم حفظ الفاتورة وخصم الكمية من المخزون',
    m_restored:'تمت استعادة قاعدة البيانات', m_backup:'تم تنزيل النسخة الاحتياطية',
    cash:'نقدي', vodafone:'فودافون كاش', instapay:'انستاباي',
    card:'بطاقة', transfer:'تحويل بنكي',
    change:'الباقي للعميل', time:'الساعة', datetime:'التاريخ والوقت', rcpt_total:'الإجمالي', m_newcust:'تم إضافة العميل الجديد لجدول العملاء',
    egp:'ج.م'
  },
  en:{
    app:'Eagle Suit', appsub:"Men's Suit Store ERP",
    invoice:'Sales Invoice', inventory:'Inventory', customers:'Customers',
    history:'Sales History', reports:'Reports', settings:'Settings', logout:'Logout',
    manager:'Osama', seller:'Salesperson', products:'Products', expenses:'Expenses',
    exp_no:'Expense No.', exp_cat:'Type', exp_desc:'Description', exp_payee:'Paid To',
    exp_amount:'Amount', exp_add:'Add Expense', exp_total:'Total Expenses',
    exp_ops:'entries', r_expenses:'Expenses Report', net_income:'Net Income',
    r_revenue:'Revenue Report',
    new:'New', save:'Save', print:'Print', cancel:'Cancel', search:'Search', edit:'Edit',
    del:'Delete', close:'Close', add:'Add', export:'Export', confirm:'Confirm', back:'Back',
    all:'All', from:'From', to:'To', total:'Total', apply:'Show', reset:'Clear',
    yes:'Yes', no:'No', none:'None', actions:'Actions', seq:'#',
    inv_no:'Invoice No.', inv_date:'Date', cust_name:'Customer Name', phone:'Phone Number',
    seller:'Salesperson', paytype:'Payment Method', items:'Invoice Items', suit:'Suit Name',
    category:'Category', color:'Color', size:'Size', qty:'Quantity', price:'Unit Price',
    disc:'Discount', line_total:'Total', grand:'Grand Total', paid:'Amount Paid',
    remain:'Remaining Balance', notes:'Notes', new_inv:'New Invoice', find_cust:'Search Customer',
    subtotal:'Items Subtotal', inv_disc:'Invoice Discount', addrow:'Add Item', barcode:'Barcode',
    buy_price:'Purchase Price', sell_price:'Selling Price', stock:'Quantity', loc:'Storage Location',
    status:'Status', supplier:'Supplier', avail:'Available', low:'Out of Stock', out:'Out of Stock',
    code:'Code', profitm:'Margin', value:'Stock Value',
    address:'Address', totalbuy:'Total Purchases', lastbuy:'Last Purchase Date',
    purchist:'Purchase History', invcount:'Invoices', balance:'Outstanding',
    pur_no:'Purchase No.', pur_date:'Supply Date', pur_sup:'Supplier', pur_tot:'Purchase Value',
    r_daily:'Daily Sales', r_monthly:'Monthly Sales', r_best:'Best Selling Suits',
    r_stock:'Current Inventory', r_low:'Out of Stock', r_cust:'Customer Purchases', r_profit:'Profit Report',
    revenue:'Revenue', cost:'Cost', profit:'Net Profit', invoices:'Invoices', pieces:'Pieces',
    st_store:'Store Information', st_print:'Invoice Printer', st_logo:'Invoice Logo',
    st_backup:'Backup', st_restore:'Restore Database', st_users:'Users',
    store_name:'Store Name', store_phone:'Phone', store_addr:'Address', currency:'Currency',
    tax:'Tax %', footer_txt:'Invoice Footer', paper:'Paper Size', username:'User Name',
    role:'Role', password:'Password',
    m_saved:'Saved successfully', m_deleted:'Record deleted', m_noitems:'Add at least one item',
    m_nocust:'Please enter the customer name', m_stock:'Requested quantity exceeds stock',
    m_conf_del:'Are you sure you want to delete this record?', m_inv_saved:'Invoice saved & stock updated',
    m_restored:'Database restored', m_backup:'Backup file downloaded',
    cash:'Cash', vodafone:'Vodafone Cash', instapay:'InstaPay',
    card:'Card', transfer:'Bank Transfer',
    change:'Change Due', time:'Time', datetime:'Date & Time', rcpt_total:'Total', m_newcust:'New customer added to the customers table',
    egp:'EGP'
  }
};
let LANG = localStorage.getItem('es_lang') || 'ar';
function t(k){ return (DICT[LANG] && DICT[LANG][k]) || (DICT.ar[k]||k); }
function setLang(l){ LANG=l; localStorage.setItem('es_lang',l);
  document.body.setAttribute('dir', l==='ar'?'rtl':'ltr');
  document.documentElement.lang=l; }

/* Bilingual values are stored as "عربي / English".
   L() shows only the active language on screen (data stays bilingual for print/export). */
function L(s){
  if(s==null) return '';
  s=String(s);
  const i=s.indexOf('/');
  if(i<0) return s.trim();
  const ar=s.slice(0,i).trim(), en=s.slice(i+1).trim();
  if(!ar) return en;
  if(!en) return ar;
  return LANG==='ar'?ar:en;
}
/* option list helper: keeps the full bilingual value, displays one language */
function optL(arr){ return arr.map(v=>({v:v,t:L(v)})); }
