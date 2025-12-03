"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface DescriptionRendererProps {
  description: string;
  className?: string;
}

export default function DescriptionRenderer({
  description,
  className = "",
}: DescriptionRendererProps) {
  if (!description) {
    return <p className="text-gray-600">No description available.</p>;
  }

  // Check if description has markdown syntax or multiple lines
  const hasMarkdown = /^#+\s|^\*\s|^-\s|^\d+\.\s|^\*\*|^__|^`|\[.*\]\(.*\)/m.test(description);
  const hasMultipleLines = description.split('\n').filter(line => line.trim()).length > 1;

  // If it's just plain text with multiple lines (old format), render as bullet list
  if (!hasMarkdown && hasMultipleLines) {
    const descriptionLines = description.split('\n').filter(line => line.trim());
    const isSmallText = className.includes('text-sm');
    return (
      <ul className={`space-y-2 ${className}`}>
        {descriptionLines.map((line, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span className={`text-gray-700 ${isSmallText ? 'text-sm' : 'text-lg'}`}>{line.trim()}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Render markdown
  const isSmallText = className.includes('text-sm');
  const baseTextSize = isSmallText ? 'text-sm' : 'text-lg';
  const headingSizes = isSmallText 
    ? {
        h1: 'text-xl',
        h2: 'text-lg',
        h3: 'text-base',
        h4: 'text-sm',
      }
    : {
        h1: 'text-4xl',
        h2: 'text-3xl',
        h3: 'text-2xl',
        h4: 'text-xl',
      };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className={`${headingSizes.h1} font-bold text-gray-900 mb-4 mt-6`}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={`${headingSizes.h2} font-bold text-gray-900 mb-3 mt-5`}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={`${headingSizes.h3} font-semibold text-gray-900 mb-2 mt-4`}>{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className={`${headingSizes.h4} font-semibold text-gray-900 mb-2 mt-3`}>{children}</h4>
          ),
          p: ({ children }) => (
            <p className={`text-gray-700 leading-relaxed ${baseTextSize} mb-4`}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2 mb-4 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 mb-4 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className={`text-gray-700 ${baseTextSize}`}>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
  );
}

