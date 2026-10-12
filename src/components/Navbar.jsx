import { MapPin } from 'lucide-react';

export default function Navbar() {
  return (
    <>
      {/* Top utility bar: Midnight Navy, subtle borders, muted text */}
      <div className="bg-[#0D1530] text-[#AAB5CC] py-2 border-b border-[#111A36] hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs tracking-widest uppercase font-semibold">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#F04432]" />
            <span>Near Rotary club, Eruvadi Main Road, Valliyur</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-[#F8B900]">Wholesale & Retail</span>
            <span className="w-px h-3 bg-[#111A36]"></span>
            <span>+91 94431 84404</span>
          </div>
        </div>
      </div>

      {/* Main navigation: Deep Navy, clean layout */}
      <header className="sticky top-0 z-50 w-full bg-[#080D1F] border-b border-[#111A36] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <img 
                src="/image.png" 
                alt="Shri Harish Crackers Logo" 
                className="h-14 w-14 object-cover rounded-sm border border-[#111A36]"
              />
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black text-[#F7F8FA] tracking-wide uppercase">
                  Shri Harish
                </span>
                <span className="text-[0.65rem] tracking-[0.3em] text-[#F8B900] uppercase font-bold mt-0.5">
                  Crackers • Valliyur
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              <a href="#" className="text-sm font-semibold tracking-wide text-[#F7F8FA] hover:text-[#F8B900] transition-colors">HOME</a>
              <a href="#pricelist" className="text-sm font-semibold tracking-wide text-[#AAB5CC] hover:text-[#F7F8FA] transition-colors">PRICE LIST</a>
              <a href="#location" className="text-sm font-semibold tracking-wide text-[#AAB5CC] hover:text-[#F7F8FA] transition-colors">LOCATION</a>
              
              {/* Premium CTA: Sharp corners, solid gold, no gradients/shadows */}
              <a 
                href="https://wa.me/919443184404" 
                className="flex items-center gap-2 bg-[#F8B900] text-[#080D1F] px-6 py-3 rounded-sm font-bold text-sm tracking-wide hover:bg-[#FFC400] transition-colors border border-[#F8B900]"
              >
                ORDER NOW
              </a>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
