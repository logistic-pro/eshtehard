export const fa = {
  // General
  appName: 'سامانه مدیریت پایانه بار اشتهارد',
  loading: 'در حال بارگذاری...',
  save: 'ذخیره',
  cancel: 'لغو',
  delete: 'حذف',
  edit: 'ویرایش',
  add: 'افزودن',
  search: 'جستجو',
  filter: 'فیلتر',
  submit: 'ارسال',
  confirm: 'تأیید',
  back: 'بازگشت',
  next: 'بعدی',
  yes: 'بله',
  no: 'خیر',
  actions: 'عملیات',
  status: 'وضعیت',
  date: 'تاریخ',
  total: 'مجموع',
  details: 'جزئیات',
  noData: 'داده‌ای یافت نشد',
  error: 'خطا',
  success: 'موفقیت',

  // Auth
  login: 'ورود',
  logout: 'خروج',
  phone: 'شماره موبایل',
  otpCode: 'کد تأیید',
  sendOtp: 'ارسال کد',
  verifyOtp: 'تأیید کد',
  resendOtp: 'ارسال مجدد کد',
  loginSubtitle: 'برای ورود شماره موبایل خود را وارد کنید',
  otpSent: 'کد تأیید به موبایل شما ارسال شد',

  // Roles
  DRIVER: 'راننده',
  FREIGHT_COMPANY: 'شرکت باربری',
  PRODUCER: 'تولیدکننده',
  TERMINAL_ADMIN: 'مدیر پایانه',

  // User status
  PENDING: 'در انتظار تأیید',
  APPROVED: 'تأیید شده',
  SUSPENDED: 'مسدود',

  // Cargo status
  DRAFT: 'پیش‌نویس',
  SUBMITTED: 'ارسال شده',
  ACCEPTED_BY_FREIGHT: 'پذیرفته شده',
  ANNOUNCED_TO_HALL: 'اعلان در سالن',
  DRIVER_ASSIGNED: 'راننده تخصیص داده شده',
  IN_TRANSIT: 'در حال حمل',
  DELIVERED: 'تحویل داده شده',
  CANCELLED: 'لغو شده',

  // Appointment status
  CONFIRMED: 'تأیید شده',
  COMPLETED: 'انجام شده',

  // Vehicle types
  TRAILER: 'تریلر',
  TRUCK: 'کامیون',
  PICKUP: 'وانت',
  VAN: 'ون',
  REFRIGERATED: 'یخچال‌دار',
  TANKER: 'تانکر',
  FLATBED: 'کفی',

  // Fleet ownership
  OWNED: 'ملکی',
  LEASED: 'استیجاری',

  // Cargo fields
  cargo: 'بار',
  cargos: 'بارها',
  referenceCode: 'کد مرجع',
  cargoType: 'نوع بار',
  weight: 'وزن',
  unit: 'واحد',
  fare: 'کرایه',
  originProvince: 'استان مبدأ',
  originCity: 'شهر مبدأ',
  destProvince: 'استان مقصد',
  destCity: 'شهر مقصد',
  description: 'توضیحات',
  isUrgent: 'فوری',
  newCargo: 'ثبت بار جدید',
  bulkUpload: 'آپلود گروهی (اکسل)',

  // Navigation
  dashboard: 'داشبورد',
  cargoList: 'لیست بارها',
  myAppointments: 'نوبت‌های من',
  profile: 'پروفایل',
  cargoRequests: 'درخواست‌های بار',
  hallDispatch: 'ارسال به سالن',
  appointmentIssue: 'صدور نوبت',
  driverManagement: 'مدیریت رانندگان',
  fleetManagement: 'مدیریت ناوگان',
  waybills: 'حواله‌ها',
  reports: 'گزارشات',
  newCargoRequest: 'ثبت درخواست بار',
  myCargoList: 'لیست بارهای من',
  driverMonitor: 'پایش رانندگان',
  freightMonitor: 'پایش باربری‌ها',
  hallManager: 'مدیریت سالن‌ها',
  userManagement: 'مدیریت کاربران',
  terminals: 'پایانه‌ها',
  halls: 'سالن‌ها',
  tickets: 'پشتیبانی',
  notifications: 'اعلان‌ها',

  // Hall / Terminal
  terminal: 'پایانه',
  hall: 'سالن',
  province: 'استان',
  city: 'شهر',
  address: 'آدرس',
  capacity: 'ظرفیت',
  shift: 'شیفت',

  // Driver / Fleet
  driver: 'راننده',
  licenseNumber: 'شماره گواهینامه',
  licenseExpiry: 'تاریخ انقضای گواهینامه',
  homeProvince: 'استان محل سکونت',
  plate: 'پلاک',
  vehicleType: 'نوع وسیله',
  ownership: 'مالکیت',
  model: 'مدل',
  year: 'سال ساخت',

  // Appointment
  appointment: 'نوبت',
  appointments: 'نوبت‌ها',
  appointmentDate: 'تاریخ نوبت',
  newAppointment: 'صدور نوبت جدید',

  // Waybill
  waybill: 'حواله',
  waybillNumber: 'شماره حواله',
  downloadPdf: 'دریافت PDF',
  issuedAt: 'تاریخ صدور',

  // Reports
  totalCargo: 'کل بارها',
  totalDrivers: 'کل رانندگان',
  totalFreight: 'کل باربری‌ها',
  pendingCargo: 'بارهای در انتظار',
  activeAppointments: 'نوبت‌های فعال',

  // Ticket
  ticket: 'تیکت',
  subject: 'موضوع',
  message: 'پیام',
  priority: 'اولویت',
  newTicket: 'تیکت جدید',
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'زیاد',
  URGENT: 'فوری',
  OPEN: 'باز',
  IN_PROGRESS: 'در حال بررسی',
  RESOLVED: 'حل شده',
  CLOSED: 'بسته',

  // Errors
  required: 'این فیلد الزامی است',
  invalidPhone: 'شماره موبایل نامعتبر است',
  invalidOtp: 'کد تأیید نامعتبر است',
  networkError: 'خطا در اتصال به سرور',
};

export type FaKeys = keyof typeof fa;
