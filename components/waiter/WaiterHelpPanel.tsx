'use client';

export function WaiterHelpPanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#F4F6F8] px-6 py-16 text-center md:bg-[#FFFFFF] md:rounded-xl md:border md:border-[#E5E7EB] md:shadow-sm">
      <p className="text-lg font-semibold text-[#1F2937]">Ayuda</p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#6B7280]">
        Pronto encontrarás aquí guías rápidas para el panel del mesero y
        respuestas frecuentes.
      </p>
    </div>
  );
}
