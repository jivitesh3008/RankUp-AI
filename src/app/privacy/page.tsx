import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10 font-sans">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Last Updated: August 30, 2026</p>
      </div>
      
      <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-outfit prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-stone-600 dark:prose-p:text-stone-300 prose-p:leading-relaxed">
        <p>
          Welcome to RankUp AI. This Privacy Policy explains how we collect, use, and protect your information when you use our educational application.
        </p>
        
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl my-6">
          <p className="text-sm text-amber-800 dark:text-amber-400 font-medium m-0">
            <strong>Important note regarding minors:</strong> RankUp AI may be used by students, including users who may be under 18. Privacy and consent requirements for minors may vary based on applicable law. RankUp is continuing to review its privacy and consent practices, and additional parental/guardian requirements may apply. Legal review is recommended before broad public marketing or unrestricted use by minors.
          </p>
        </div>

        <h2>1. Information We Collect</h2>
        <p>When you use RankUp AI, we collect the following types of information:</p>
        <ul>
          <li><strong>Account Information:</strong> Your display name, email address, and authentication information provided during signup.</li>
          <li><strong>Educational Information:</strong> Information about your learning progress, including test attempts and results, answer evaluation results, Mistake Book entries, progress and activity, and topic information.</li>
          <li><strong>Technical and Security Data:</strong> Standard technical information such as your IP address (used strictly for rate-limiting and security), timestamps, and relevant server/error logs.</li>
        </ul>
        <p>RankUp does not intentionally collect unnecessary personal information such as phone numbers, home addresses, precise locations, school names, or dates of birth.</p>

        <h2>2. How We Handle Handwritten Images</h2>
        <p>
          RankUp AI allows you to upload photos of your handwritten work for AI evaluation. 
          <strong>RankUp does not permanently store the image.</strong> Images are temporarily processed and may be transmitted to Google Gemini. 
          RankUp application storage does not permanently retain the uploaded image. Only the extracted evaluation information and transcribed text may be stored in your account. 
          Google's handling of submitted content is governed by their API terms.
        </p>

        <h2>3. Third-Party Services and AI Data Use</h2>
        <p>
          RankUp AI relies on third-party services to function. We use:
        </p>
        <ul>
          <li><strong>Supabase:</strong> For database hosting, authentication, and secure data storage.</li>
          <li><strong>Google Gemini:</strong> To process submitted text and images for features such as tutoring, question understanding, test generation, and answer evaluation.</li>
          <li><strong>Netlify:</strong> For application hosting.</li>
        </ul>
        <p>
          RankUp uses Google Gemini to process submitted text and images. Google's handling of data submitted through the Gemini API is governed by the terms and data-use policies applicable to the Gemini API service and plan used by RankUp. Student-submitted information may be processed by AI providers to provide features (e.g., text questions for tutoring, uploaded images for image understanding, handwritten answers for evaluation, and video transcripts for YouTube-based test generation).
        </p>

        <h2>4. How We Use Your Data</h2>
        <p>We use your data solely for the following purposes:</p>
        <ul>
          <li>To provide personalized educational tutoring, test generation, grading, and feedback.</li>
          <li>To maintain your Mistake Book and track your progress over time.</li>
          <li>To secure your account and prevent abuse (e.g., rate limiting).</li>
        </ul>
        <p><strong>We do not use student data for targeted advertising.</strong> Furthermore, we do not use third-party behavioral analytics/tracking scripts beyond standard operational logs and rate limits.</p>

        <h2>5. Data Access, Export, and Deletion</h2>
        <p>You have control over your data. From the <strong>Settings</strong> page, you can:</p>
        <ul>
          <li><strong>Download your data:</strong> Export a structured file containing your account details, profile, activity history, test attempts, evaluations, and mistake book.</li>
          <li><strong>Delete your account:</strong> Permanently and irreversibly delete your profile and all associated educational data from our application servers. Your authentication identity will also be removed. Some technical operational logs (like rate-limiting records) are periodically purged. Temporary third-party processing data is handled according to those providers' retention policies and is outside RankUp's direct control.</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          Your application account data and educational history are retained as long as your account is active. 
          Temporary processing data (like uploaded images) are not retained permanently by RankUp. Technical and security logs are rotated and purged periodically.
          Where data is sent to a third-party provider (e.g., Google Gemini), retention is subject to that provider's applicable terms and policies.
        </p>

        <h2>7. Security</h2>
        <p>
          We use technical and organizational measures intended to protect your information. This includes Row Level Security (RLS) to ensure you can only access your own data, server-side secrets that are never exposed to the client, rate limiting to prevent abuse, input validation, and controlled image handling.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or your data, please contact our Privacy Team at <strong>privacy@rankup.ai</strong> (Placeholder: Requires update before launch).
        </p>
      </div>
    </div>
  );
}
