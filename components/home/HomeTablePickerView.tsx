'use client';

import type { Table } from '@/lib/model/types';

export interface HomeTablePickerViewProps {
  language: string;
  onLanguageChange: (value: string) => void;
  tables: Table[];
  onOrderNow: (tableId: string) => void;
  onEmployeeLogin: () => void;
}

const selectClass =
  'w-full cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[15px] text-[#1F2937] shadow-sm outline-none transition focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/35';

export function HomeTablePickerView({
  language,
  onLanguageChange,
  tables,
  onOrderNow,
  onEmployeeLogin,
}: HomeTablePickerViewProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-8 text-center shadow-sm sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#229ED9]">
            Bienvenido
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1F2937] sm:text-3xl">
            Selecciona tu mesa
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6B7280]">
            Elige idioma y la mesa donde estás para continuar al menú y al chat
            con el mesero.
          </p>
        </header>

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <label
            htmlFor="language"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]"
          >
            Idioma
          </label>
          <select
            id="language"
            className={selectClass}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="">Seleccionar idioma</option>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>

          <h2 className="mb-4 mt-10 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Mesas disponibles
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tables.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onOrderNow(t.id)}
                className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-5 text-center text-sm font-semibold text-[#1F2937] shadow-sm transition hover:border-[#229ED9]/35 hover:bg-[#F1F5F9] active:brightness-95"
              >
                {t.name}
              </button>
            ))}
          </div>
        </section>

        <div className="text-center">
          <button
            type="button"
            onClick={onEmployeeLogin}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-[#229ED9] transition hover:bg-[#E3F2FD]"
          >
            Soy empleado / iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
