import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-kairo-primary text-kairo-light-gray font-light px-6 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-kairo-orange hover:text-kairo-white transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        
        <h1 className="text-3xl md:text-5xl font-serif text-kairo-white uppercase tracking-wider mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-sm md:text-base leading-relaxed tracking-wide">
          <p>Last updated: June 8, 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">1. Acceptance of Terms</h2>
            <p>By accessing or using Kairo, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">2. Description of Service</h2>
            <p>Kairo provides a platform for discovering, bookmarking, and getting recommendations for tech events, hackathons, and conferences. We aggregate data from various public sources; however, we do not guarantee the accuracy or availability of external events.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">3. User Accounts</h2>
            <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">4. Third-Party Links</h2>
            <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by Kairo. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third party web sites or services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">5. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:ayushmansahoo614@gmail.com" className="text-kairo-orange hover:underline">ayushmansahoo614@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
