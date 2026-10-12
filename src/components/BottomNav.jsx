import { Home, FileText, MapPin, Phone } from 'lucide-react';

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 w-full bg-[#0D1530] border-t border-[#111A36] flex justify-around items-center h-16 z-50 px-2 pb-safe">
      <a href="#" className="flex flex-col items-center gap-1.5 text-[#F8B900]">
        <Home size={18} strokeWidth={2} />
        <span className="text-[9px] font-bold tracking-wider uppercase">Home</span>
      </a>
      <a href="#pricelist" className="flex flex-col items-center gap-1.5 text-[#AAB5CC] hover:text-[#F7F8FA] transition-colors">
        <FileText size={18} strokeWidth={1.5} />
        <span className="text-[9px] font-semibold tracking-wider uppercase">Prices</span>
      </a>
      <a href="#location" className="flex flex-col items-center gap-1.5 text-[#AAB5CC] hover:text-[#F7F8FA] transition-colors">
        <MapPin size={18} strokeWidth={1.5} />
        <span className="text-[9px] font-semibold tracking-wider uppercase">Locate</span>
      </a>
      <a href="tel:9443184404" className="flex flex-col items-center gap-1.5 text-[#AAB5CC] hover:text-[#F7F8FA] transition-colors">
        <Phone size={18} strokeWidth={1.5} />
        <span className="text-[9px] font-semibold tracking-wider uppercase">Call</span>
      </a>
    </div>
  );
}