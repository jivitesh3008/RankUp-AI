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
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Last Updated: August 29, 2026</p>
      </div>
      
      <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-outfit prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-stone-600 dark:prose-p:text-stone-300 prose-p:leading-relaxed">
        <p>
          Welcome to RankUp AI. This Privacy Policy explains how we collect, use, and protect your information when you use our educational application. We are committed to transparency and to protecting the privacy of students.
        </p>
        
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl my-6">
          <p className="text-sm text-amber-800 dark:text-amber-400 font-medium m-0">
            <strong>Important note regarding children:</strong> RankUp AI is an educational tool. We require a legal review to formally satisfy COPPA (Children's Online Privacy Protection Act) or DPDP (Digital Personal Data Protection) requirements. Until this review is complete, RankUp AI should be used by minors only under the supervision and consent of a parent, guardian, or authorized school official.
          </p>
        </div>

        <h2>1. Information We Collect</h2>
        <p>When you use RankUp AI, we collect the following types of information:</p>
        <ul>
          <li><strong>Account Information:</strong> Your display name, email address, and authentication data provided during signup.</li>
          <li><strong>Educational Activity:</strong> Information about your learning progress, including test scores, correct/incorrect answers, evaluations of your written work, and mistakes recorded in your Mistake Book.</li>
          <li><strong>Technical Data:</strong> Standard technical information such as your IP address (used strictly for rate-limiting and security), timestamps, and error logs.</li>
        </ul>
        <p>We practice data minimization and do not collect phone numbers, dates of birth, precise location, or school names.</p>

        <h2>2. How We Handle Your Handwritten Images</h2>
        <p>
          RankUp AI allows you to upload photos of your handwritten work for AI evaluation. 
          <strong>We do not permanently store these images in our database.</strong> 
          Images are securely transmitted to our AI provider (Google Gemini) for analysis. Once the analysis is complete and the text/diagram is transcribed into your Mistake Book or evaluation history, the original image file is discarded by our servers. The extracted text and evaluation results are permanently saved so you can review them later.
        </p>

        <h2>3. Use of Artificial Intelligence (AI) Services</h2>
        <p>
          RankUp AI is powered by AI. When you chat with the Tutor, request a test, or evaluate a handwritten answer, your input (text and temporarily, images) is securely transmitted to our AI partner, Google Gemini, for processing.
        </p>
        <p>
          The AI provider acts as a data processor to generate the educational feedback. They are prohibited from using your personal student data to train their public models.
        </p>

        <h2>4. How We Use Your Data</h2>
        <p>We use your data solely for the following purposes:</p>
        <ul>
          <li>To provide personalized educational tutoring, grading, and feedback.</li>
          <li>To maintain your Mistake Book and track your progress over time.</li>
          <li>To secure your account and prevent abuse (e.g., rate limiting).</li>
        </ul>
        <p><strong>We do not sell your personal data. We do not use your data for targeted advertising.</strong></p>

        <h2>5. Data Access, Export, and Deletion</h2>
        <p>You have full control over your data. From the <strong>Settings</strong> page, you can:</p>
        <ul>
          <li><strong>Download your data:</strong> Export a structured JSON file containing all your activity, tests, evaluations, and mistakes.</li>
          <li><strong>Delete your account:</strong> Permanently and irreversibly delete your profile and all associated educational data from our servers.</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          Your account information and educational records are retained as long as your account is active, so that you can track your learning progress. If you delete your account, this data is immediately deleted. Technical logs (like rate-limiting records) are periodically purged.
        </p>

        <h2>7. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or your data, please contact us by visiting our <Link href="/contact" className="text-teal-600 hover:underline">Contact page</Link>.
        </p>
      </div>
    </div>
  );
}
