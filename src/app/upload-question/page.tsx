'use client';

import { Camera, Image as ImageIcon, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function UploadQuestionPage() {
  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full mt-2 sm:mt-8 mb-8">
      
      <div className="mb-6">
        <PageHeader title="Upload a Question" backHref="/" />
        <p className="text-foreground/60 mt-1 ml-[3.25rem] -mt-2">Get step-by-step help instantly.</p>
      </div>

      {/* Large central upload zone */}
      <div className="relative group cursor-pointer">
        <div className="absolute inset-0 bg-primary-500/5 rounded-3xl blur-xl group-hover:bg-primary-500/10 transition-colors" />
        <div className="relative bg-card-bg border-2 border-dashed border-card-border hover:border-primary-500/50 rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[300px]">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Camera className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Take a photo</h3>
          <p className="text-foreground/50 text-sm max-w-[200px] mb-8">or choose an image from your gallery</p>
          
          <div className="flex gap-4 w-full max-w-xs">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors tap-scale">
              <Camera className="w-5 h-5" />
              Camera
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-card-border/50 hover:bg-card-border text-foreground rounded-xl font-medium transition-colors tap-scale">
              <ImageIcon className="w-5 h-5" />
              Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Recent uploads */}
      <div className="mt-12">
        <h3 className="text-sm font-bold text-foreground/80 font-outfit mb-4">RECENT UPLOADS</h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-card-border/30 rounded-xl flex items-center justify-center group hover:bg-card-border/50 transition-colors cursor-pointer border border-transparent hover:border-primary-500/30 overflow-hidden">
               <UploadCloud className="w-6 h-6 text-foreground/20 group-hover:text-primary-500/50" />
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
