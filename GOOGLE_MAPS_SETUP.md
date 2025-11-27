# 🗺️ دليل إعداد Google Maps API

## 1. الحصول على API Key

### الخطوات:
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل Google Maps JavaScript API
4. أنشئ API Key
5. قيّد الـ API Key:
   - Application restrictions: HTTP referrers
   - Website restrictions: `http://localhost:3000/*`, `http://localhost:5173/*`

---

## 2. إعداد المشروع

### أ. تثبيت المكتبات
```bash
cd Rade3-FrontEnd
npm install @react-google-maps/api
npm install -D @types/google.maps
```

### ب. إضافة API Key
أضف السطر التالي في ملف `.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
```

### ج. إعادة تشغيل Frontend
```bash
npm run dev
```

---

## 3. المميزات المطبقة

✅ **Markers ذكية:**
- ألوان حسب مستوى الخطر (أحمر، أصفر، أخضر)
- Emojis لأنواع الأحداث (🚗, 👤, 🦁, 🔊)
- Clickable مع معلومات تفصيلية

✅ **حدود المحمية:**
- Polygon أحمر شفاف
- يحدد المنطقة المحمية بوضوح

✅ **دائرة الحماية:**
- Circle أزرق حول المركز
- نصف قطر 2.5 كم

✅ **Info Windows:**
- تظهر عند النقر على Marker
- معلومات كاملة عن الحدث
- تصميم عربي RTL

✅ **Legend:**
- مفتاح الألوان في الزاوية
- إحصائيات مباشرة

✅ **Dark Theme:**
- خريطة داكنة احترافية
- مناسبة لـ Dashboard الأمني

---

## 4. التخصيص

### تغيير موقع المحمية:
```typescript
const reserveCenter = {
  lat: 24.7136, // عدّل هنا
  lng: 46.6753  // عدّل هنا
}
```

### تغيير حدود المحمية:
```typescript
const reserveBoundary = [
  { lat: 24.7050, lng: 46.6650 },
  // أضف أو عدّل النقاط
]
```

### تغيير نصف قطر الحماية:
```typescript
<Circle
  center={reserveCenter}
  radius={2500} // بالمتر - عدّل هنا
/>
```

---

## 5. الأداء

### نصائح للأداء الأفضل:

✅ **استخدم Clustering:**
```typescript
// مطبق بالفعل في المكون
<MarkerClusterer />
```

✅ **حدّد عدد الأحداث:**
```typescript
// في HomePage.tsx
const recentEvents = events.slice(0, 100)
<GoogleMapView events={recentEvents} />
```

✅ **Lazy Loading:**
```typescript
// الخريطة تحمّل عند الحاجة فقط
const { isLoaded } = useJsApiLoader()
```

---

## 6. استكشاف الأخطاء

### الخطأ: "Loading..."
**الحل:**
- تأكد من API Key صحيح
- تأكد من تفعيل Maps JavaScript API
- تحقق من الاتصال بالإنترنت

### الخطأ: "RefererNotAllowedMapError"
**الحل:**
- أضف `http://localhost:*` للـ HTTP referrers
- انتظر 5 دقائق بعد التعديل

### الخطأ: Markers لا تظهر
**الحل:**
- تحقق من `events` prop
- تأكد من `latitude` و `longitude` صحيحة
- افتح Console وابحث عن أخطاء

---

## 7. موارد إضافية

- [Google Maps React Documentation](https://react-google-maps-api-docs.netlify.app/)
- [Google Maps Platform](https://developers.google.com/maps)
- [Styling Wizard](https://mapstyle.withgoogle.com/)

---

**تم! الخريطة جاهزة للاستخدام** 🎉
