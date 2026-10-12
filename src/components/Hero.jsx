import { Download, ArrowUpRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-[#080D1F] border-b border-[#111A36] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[85vh] py-16 lg:py-0">
          
          {/* Left Content: Editorial Typography & Strong Alignment */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Minimal accent line instead of a pill badge */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-8 bg-[#F04432]"></div>
              <span className="text-[#F8B900] text-xs font-bold tracking-[0.25em] uppercase">
                Est. Quality Fireworks
              </span>
            </div>
            
            {/* Display typography using standard serif fallback to emulate high-end print */}
            <h1 className="text-5xl lg:text-7xl font-serif text-[#F7F8FA] leading-[1.1] mb-6">
              Celebrate <br />
              <span className="italic text-[#AAB5CC]">with</span> Brilliance.
            </h1>
            
            <p className="text-base lg:text-lg text-[#AAB5CC] leading-relaxed max-w-md mb-10 font-light">
              Premium wholesale and retail fireworks located in Valliyur. We provide an authentic, safe, and spectacular experience for every occasion.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://wa.me/919443184404" 
                target="_blank" 
                rel="noreferrer"
                className="group flex items-center justify-between gap-4 bg-[#F8B900] text-[#080D1F] px-6 py-4 rounded-sm font-bold text-sm tracking-wide hover:bg-[#FFC400] transition-colors"
              >
                <span>WHATSAPP ORDER</span>
                <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              
              <a 
                href="/pricelist.pdf" 
                download
                className="flex items-center justify-center gap-3 bg-transparent text-[#F7F8FA] border border-[#111A36] hover:border-[#AAB5CC] px-6 py-4 rounded-sm font-bold text-sm tracking-wide transition-colors"
              >
                <Download size={18} className="text-[#F8B900]" />
                <span>PRICE LIST '26</span>
              </a>
            </div>
          </div>

          {/* Right Content: Framed Image Composition (Controlled Asymmetry) */}
          <div className="lg:col-span-7 relative h-full w-full flex items-center justify-end">
            <div className="w-full lg:w-[90%] aspect-[4/5] lg:aspect-square relative p-3 border border-[#111A36]">
              {/* Image Container - Sharp edges, no shadows */}
              <div className="w-full h-full bg-[#0D1530] relative overflow-hidden">
                <img src="/image.png" alt="Shri Harish Crackers Storefront" className="w-full h-full object-cover grayscale-[20%] contrast-125" />
                {/* 
                  When you have the photo, replace the div above with:
                  <img src="/your-shop-photo.jpg" alt="Shri Harish Crackers Storefront" className="w-full h-full object-cover grayscale-[20%] contrast-125" />
                */}
              </div>
              
              {/* Subtle decorative accent */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-[#F8B900] hidden lg:block"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}