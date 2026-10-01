import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  isBlock?: boolean;
  isPureMath?: boolean;
}

export function MathRenderer({ content, isBlock = false, isPureMath = false }: MathRendererProps) {
  // We need to ensure that the content is properly delimited for remark-math.
  // remark-math expects inline math to be surrounded by single $ and block math by $$
  
  let processedContent = content || '';
  
  // Only wrap automatically if it's designated as pure math and lacks delimiters
  if (isPureMath && processedContent && !processedContent.includes('$')) {
    processedContent = isBlock ? `$$\n${processedContent}\n$$` : `$${processedContent}$`;
  }

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkMath]} 
      rehypePlugins={[rehypeKatex]}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
