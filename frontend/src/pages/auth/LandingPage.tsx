import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ArrowRight, BarChart3, Users, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-20 border-b border-border bg-white flex items-center justify-between px-6 sm:px-10">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">V</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">VendorBridge</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Login
          </Link>
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-primary tracking-tight max-w-4xl mx-auto leading-tight">
            Enterprise Procurement & Vendor Management, <span className="text-muted-foreground">Unified.</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your entire source-to-pay workflow. Manage RFQs, compare quotations, approve purchase orders, and process invoices in one clean, professional dashboard.
          </p>
          <div className="mt-10 flex items-center justify-center space-x-4">
            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white">
                Login to Portal
              </Button>
            </Link>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-20 bg-secondary/50 border-y border-border">
          <div className="max-w-7xl mx-auto px-6 sm:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-primary">The Complete End-to-End Workflow</h2>
              <p className="mt-4 text-muted-foreground text-lg">Every step of your procurement process, seamlessly connected.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 -translate-y-1/2"></div>
              
              <div className="bg-white p-6 rounded-xl border border-border shadow-soft relative z-10">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Request for Quote</h3>
                <p className="text-sm text-muted-foreground">Create detailed RFQs and invite approved vendors to bid.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-border shadow-soft relative z-10">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Vendor Quotations</h3>
                <p className="text-sm text-muted-foreground">Vendors submit bids via their dedicated portal view.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-border shadow-soft relative z-10">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Compare & Approve</h3>
                <p className="text-sm text-muted-foreground">Side-by-side comparison matrix and automated approval routing.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-border shadow-soft relative z-10">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">4. PO & Invoicing</h3>
                <p className="text-sm text-muted-foreground">Auto-generate purchase orders and process vendor invoices.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-white border-t border-border text-center text-sm text-muted-foreground">
        <p>&copy; 2026 VendorBridge ERP. All rights reserved.</p>
      </footer>
    </div>
  );
}
