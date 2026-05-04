'use client';

import type { BasicInfoState } from '@/lib/viewmodels/useRegisterRestaurantViewModel';

const inputClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] placeholder:text-[#6B7280] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export interface Step1BasicInfoProps {
  value: BasicInfoState;
  onChange: (value: BasicInfoState) => void;
}

export function Step1BasicInfo({ value, onChange }: Step1BasicInfoProps) {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1F2937]">
          Datos del restaurante
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Información básica y contacto del propietario.
        </p>
      </header>

      <input
        className={inputClass}
        placeholder="Nombre del restaurante"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <input
        className={inputClass}
        placeholder="Nombre del propietario"
        value={value.ownerName}
        onChange={(e) => onChange({ ...value, ownerName: e.target.value })}
      />
      <input
        className={inputClass}
        type="email"
        placeholder="Correo de contacto"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        autoComplete="email"
      />
      <input
        className={inputClass}
        placeholder="Teléfono"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
        autoComplete="tel"
      />
    </div>
  );
}
