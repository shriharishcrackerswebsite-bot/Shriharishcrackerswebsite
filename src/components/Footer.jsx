import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#080D1F] border-t border-[#111A36] pt-20 pb-10" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Large Brand Mark & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src="/image.png" 
                alt="Shri Harish Crackers Logo" 
                className="h-12 w-12 object-cover rounded-sm grayscale"
              />
              <span className="text-2xl font-serif text-[#F7F8FA] uppercase tracking-wide">
                Shri Harish
              </span>
            </div>
            <p className="text-[#AAB5CC] font-light leading-relaxed max-w-sm">
              Providing premium quality fireworks and exceptional service to Valliyur and beyond. Direct from manufacturers.
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <h3 className="text-[#F8B900] text-xs font-bold tracking-[0.2em] uppercase mb-6">Contact</h3>
            <ul className="space-y-4 text-sm text-[#F7F8FA] font-light">
              <li><a href="tel:9443184404" className="hover:text-[#F8B900] transition-colors">+91 94431 84404</a></li>
              <li><a href="tel:9629917375" className="hover:text-[#F8B900] transition-colors">+91 96299 17375</a></li>
              <li className="pt-2">
                <a href="mailto:shriharishcrackers@gmail.com" className="flex items-center gap-2 text-[#AAB5CC] hover:text-[#F7F8FA] transition-colors">
                  shriharishcrackers@gmail.com
                  <ArrowUpRight size={14} />
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-[#F8B900] text-xs font-bold tracking-[0.2em] uppercase mb-6">Visit</h3>
            <address className="not-italic text-sm text-[#AAB5CC] font-light leading-relaxed">
              Near Rotary club,<br />
              Eruvadi main road,<br />
              Valliyur - 627117<br />
              Tamil Nadu
            </address>
          </div>

        </div>
        
        {/* Bottom Section: Strict borders, clean typography */}
        <div className="border-t border-[#111A36] pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-medium text-[#AAB5CC] tracking-wide uppercase">
          <p>© {new Date().getFullYear()} Shri Harish Crackers.</p>
          <p>Design by Human.</p>
        </div>
      </div>
    </footer>
  );
}