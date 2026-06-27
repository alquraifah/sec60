export interface City {
  id: string;
  nameEn: string;
  nameAr: string;
  peakSunHours: number;
}

export const CITIES: City[] = [
  { id: 'riyadh', nameEn: 'Riyadh', nameAr: 'الرياض', peakSunHours: 6.2 },
  { id: 'jeddah', nameEn: 'Jeddah', nameAr: 'جدة', peakSunHours: 5.8 },
  { id: 'dammam', nameEn: 'Dammam', nameAr: 'الدمام', peakSunHours: 5.9 },
  { id: 'qassim', nameEn: 'Qassim', nameAr: 'القصيم', peakSunHours: 6.0 },
  { id: 'madinah', nameEn: 'Madinah', nameAr: 'المدينة المنورة', peakSunHours: 6.0 },
  { id: 'makkah', nameEn: 'Makkah', nameAr: 'مكة المكرمة', peakSunHours: 5.9 },
  { id: 'abha', nameEn: 'Abha', nameAr: 'أبها', peakSunHours: 5.5 },
  { id: 'tabuk', nameEn: 'Tabuk', nameAr: 'تبوك', peakSunHours: 6.3 },
];

export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
