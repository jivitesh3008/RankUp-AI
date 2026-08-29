import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10 font-sans">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Last Updated: August 29, 2026</p>
      </div>
      
      <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-outfit prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-stone-600 dark:prose-p:text-stone-300 prose-p:leading-relaxed">
        <p>
          Welcome to RankUp AI. By creating an account and using our application, you agree to these Terms of Service. Please read them carefully.
        </p>

        <h2>1. Educational Purpose Only</h2>
        <p>
          RankUp AI is an educational tool designed to help Class 10 students learn and practice Science concepts. It is meant to supplement, not replace, formal schooling and instruction. 
        </p>

        <h2>2. AI Limitations and Disclaimers</h2>
        <p>
          RankUp AI uses artificial intelligence (Google Gemini) to evaluate handwritten answers, act as a tutor, and generate tests. While we strive for accuracy:
        </p>
        <ul>
          <li><strong>AI-Assisted Evaluation:</strong> All scores and feedback provided by the Answer Evaluator are "AI-estimated" and do NOT constitute official CBSE marking.</li>
          <li><strong>Potential Inaccuracies:</strong> AI can occasionally make mistakes. Students should use appropriate judgment, verify important facts against their NCERT textbooks, and consult teachers when in doubt.</li>
        </ul>
        <p>We do not guarantee the absolute accuracy, completeness, or reliability of AI-generated content.</p>

        <h2>3. User Responsibilities and Prohibited Misuse</h2>
        <p>You agree to use RankUp AI responsibly. You must not:</p>
        <ul>
          <li>Use the platform for any illegal purpose or to violate any laws.</li>
          <li>Attempt to bypass rate limits, abuse the AI quotas, or disrupt the service (e.g., through automated scripts or bots).</li>
          <li>Upload malicious files, explicit content, or content containing sensitive personal information belonging to others.</li>
        </ul>

        <h2>4. Account Responsibilities</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account. If you believe your account has been compromised, you must delete your account or contact us immediately.
        </p>

        <h2>5. Availability and Service Interruptions</h2>
        <p>
          RankUp AI relies on third-party services (like Supabase and Google Gemini). We do not guarantee continuous, uninterrupted access to the platform. We may suspend or limit access temporarily for maintenance, upgrades, or due to external outages.
        </p>

        <h2>6. Account Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account if you violate these Terms, abuse the AI limits, or otherwise disrupt the platform. You may terminate these terms at any time by deleting your account via the Settings page.
        </p>

        <h2>7. Changes to the Service</h2>
        <p>
          We may update, modify, or discontinue RankUp AI or any of its features at any time without prior notice.
        </p>

        <h2>8. Contact Information</h2>
        <p>
          For any questions about these Terms, please visit our <Link href="/contact" className="text-teal-600 hover:underline">Contact page</Link>.
        </p>
      </div>
    </div>
  );
}
