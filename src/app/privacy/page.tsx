import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-kairo-primary text-kairo-light-gray font-light px-6 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-kairo-orange hover:text-kairo-white transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        
        <h1 className="text-3xl md:text-5xl font-serif text-kairo-white uppercase tracking-wider mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-sm md:text-base leading-relaxed tracking-wide">
          <p>Last updated: June 8, 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">1. Information We Collect</h2>
            <p>At Kairo, we prioritize your privacy. We collect minimal information required to provide you with the best event discovery experience. This includes:</p>
            <ul className="list-disc pl-5 space-y-2 text-kairo-light-gray/80">
              <li>Account information (Name, Email) provided during Google Authentication.</li>
              <li>Event preferences (City, Event Categories, Bookmarks) to tailor your recommendations.</li>
              <li>Usage data (Events viewed, interactions) to improve our recommendation algorithms.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">2. How We Use Your Data</h2>
            <p>We use your data exclusively to:</p>
            <ul className="list-disc pl-5 space-y-2 text-kairo-light-gray/80">
              <li>Provide personalized event recommendations.</li>
              <li>Send notifications for upcoming saved events or registration deadlines (if opted-in).</li>
              <li>Improve the platform and underlying machine learning models.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">3. Data Sharing</h2>
            <p>We do not sell, rent, or trade your personal information to third parties. Your data is securely stored using Firebase infrastructure.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif text-kairo-white uppercase tracking-wider">4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@kairo.app.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
