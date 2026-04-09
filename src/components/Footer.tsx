import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground border-t-4 border-secondary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg leading-none">
                  Geo<span className="text-secondary">Tech</span> Labs
                </div>
                <div className="text-xs text-primary-foreground/40 leading-none mt-0.5">
                  by Velciti
                </div>
              </div>
            </Link>
            <p className="text-sm text-primary-foreground/50 leading-relaxed max-w-xs">
              Official sample tracking portal of Velciti Consulting Engineers Pvt. Ltd. — India's trusted geotechnical investigation company since 2010.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border border-secondary/30 rounded-md text-xs font-semibold text-secondary/70 tracking-wider uppercase">
              ✓ NABL Accredited
            </div>
          </div>

          {/* Portal links */}
          <div>
            <h4 className="text-xs font-bold text-primary-foreground/40 uppercase tracking-widest mb-4">
              Portal
            </h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
             
              <li>
                <Link to="/login" className="hover:text-secondary transition-colors">
                  Login to portal
                </Link>
              </li>
              <li>
                <Link to="/#how" className="hover:text-secondary transition-colors">
                  How it works
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-primary-foreground/40 uppercase tracking-widest mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li>support@velciti.com</li>
              <li>+91 44-XXXX-XXXX</li>
              <li>Velachery, Chennai</li>
              <li>Tamil Nadu — 600 042</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-foreground/30">
            © {new Date().getFullYear()} Velciti Consulting Engineers Pvt. Ltd. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/30">
            GeoTech Labs · 
            <a href="#" className="hover:text-secondary transition-colors ml-1">Privacy policy</a> · 
            <a href="#" className="hover:text-secondary transition-colors ml-1">Terms of use</a>
          </p>
        </div>
      </div>
    </footer>
  )
}