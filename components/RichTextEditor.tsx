"use client";

import React, { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { MathExtension } from "@aarkue/tiptap-math-extension"; // ⬅ named import
import {
  uploadImage,
  validateImageFile,
  getImageStorageConfig,
} from "@/lib/utils/imageStorage";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
  imageFolder?: string; // Optional folder path for organizing images
}

// Toolbar button component
const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, isActive, title, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-1.5 rounded text-sm font-medium transition-colors
      ${isActive ? "bg-gray-300 text-gray-900" : "text-gray-700 hover:bg-gray-200"}
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
    `}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

// Link modal
const LinkModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
}> = ({ isOpen, onClose, onInsert, initialUrl = "", initialText = "" }) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setUrl(initialUrl);
    setText(initialText);
  }, [initialUrl, initialText, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onInsert(url.trim(), text.trim() || url.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Text (optional)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Link text"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Insert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Special characters modal
const SpecialCharsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onInsert: (char: string) => void;
}> = ({ isOpen, onClose, onInsert }) => {
  const specialChars = [
    // Greek letters
    ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ"],
    ["ν", "ξ", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω"],
    ["Α", "Β", "Γ", "Δ", "Ε", "Ζ", "Η", "Θ", "Ι", "Κ", "Λ", "Μ"],
    ["Ν", "Ξ", "Π", "Ρ", "Σ", "Τ", "Υ", "Φ", "Χ", "Ψ", "Ω"],
    // Math symbols
    ["±", "×", "÷", "≠", "≤", "≥", "≈", "∞", "∑", "∏", "∫", "√"],
    ["∂", "∇", "∆", "∈", "∉", "⊂", "⊃", "∪", "∩", "∅", "∴", "∵"],
    // Arrows
    ["→", "←", "↑", "↓", "↔", "⇒", "⇐", "⇔", "⇄", "⇆"],
    // Other symbols
    ["°", "′", "″", "‰", "€", "£", "¥", "©", "®", "™", "§", "¶"],
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Special Characters</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-3">
          {specialChars.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-2">
              {row.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => {
                    onInsert(char);
                    onClose();
                  }}
                  className="w-10 h-10 text-lg border border-gray-300 rounded hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={char}
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
  minHeight = "200px",
  disabled = false,
  imageFolder,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [specialCharsOpen, setSpecialCharsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Load KaTeX CSS globally on client
  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const existingLink = document.querySelector('link[href*="katex.min.css"]');
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    }
  }, []);

  // Editor extensions
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: {
          HTMLAttributes: {
            class: "code-block",
          },
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: placeholder || "Start typing...",
        emptyEditorClass: "is-editor-empty",
      }),
      MathExtension.configure({
        evaluation: false, // only render LaTeX, no auto-calc
        addInlineMath: true,
        renderTextMode: "raw-latex",
        katexOptions: {
          throwOnError: false,
          errorColor: "#cc0000",
        },
      }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: "ProseMirror",
        style: `min-height: ${minHeight};`,
      },
    },
    autofocus: false,
  });

  // Sync external value -> editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(value || "", false);
      try {
        editor.commands.setTextSelection({ from, to });
      } catch {
        // ignore invalid selection
      }
    }
  }, [value, editor]);

  // Image upload
  const handleImageUpload = useCallback(async () => {
    if (!editor || disabled) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      const validation = validateImageFile(file);
      if (!validation.isValid) {
        alert(validation.error || "Invalid image file");
        return;
      }

      setIsUploading(true);
      setUploadProgress("Uploading image...");

      const { from } = editor.state.selection;

      try {
        const config = getImageStorageConfig();
        // Use provided imageFolder if available, otherwise use default from config
        if (imageFolder) {
          config.folder = imageFolder;
        }
        const uploadResult = await uploadImage(file, config);

        editor
          .chain()
          .focus()
          .setTextSelection(from)
          .insertContent({
            type: "image",
            attrs: {
              src: uploadResult.url,
              alt: file.name || "Uploaded image",
            },
          })
          .run();

        setUploadProgress(null);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Failed to upload image";
        alert(msg);
        console.error("[RichTextEditor] Image upload error:", error);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    };
    input.click();
  }, [editor, disabled]);

  // Link insert
  const handleLinkInsert = useCallback(
    (url: string, text?: string) => {
      if (!editor) return;

      if (editor.isActive("link")) {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      } else {
        if (text) {
          editor
            .chain()
            .focus()
            .insertContent(`<a href="${url}">${text}</a>`)
            .run();
        } else {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }
    },
    [editor]
  );

  // Special char insert
  const handleSpecialCharInsert = useCallback(
    (char: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(char).run();
    },
    [editor]
  );

  // Math insert button – inserts a LaTeX snippet delimited by $
  const handleMathInsert = useCallback(() => {
    if (!editor || disabled) return;

    // If there is a selection, wrap it in $...$, else insert template
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from, to },
          `$${selectedText || "x^2"}$`
        )
        .run();
    } else {
      editor.chain().focus().insertContent("$E=mc^2$").run();
    }
    // the MathExtension input rule will convert this into rendered KaTeX
  }, [editor, disabled]);

  if (!isMounted) {
    return (
      <div
        className={`border border-gray-300 rounded p-4 bg-gray-50 ${className}`}
        style={{ minHeight }}
      >
        <div className="flex items-center justify-center text-gray-500">
          Loading editor...
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div
        className={`border border-gray-300 rounded p-4 bg-gray-50 ${className}`}
        style={{ minHeight }}
      >
        <div className="flex items-center justify-center text-gray-500">
          Initializing editor...
        </div>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="border border-gray-300 border-b-0 rounded-t-lg bg-gray-50 p-2">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Text formatting */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
              disabled={disabled}
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
              disabled={disabled}
            >
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
              disabled={disabled}
            >
              <u>U</u>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
              disabled={disabled}
            >
              <s>S</s>
            </ToolbarButton>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
              disabled={disabled}
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
              disabled={disabled}
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
              disabled={disabled}
            >
              H3
            </ToolbarButton>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
              disabled={disabled}
            >
              •
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
              disabled={disabled}
            >
              1.
            </ToolbarButton>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title="Align Left"
              disabled={disabled}
            >
              ⬅
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              isActive={editor.isActive({ textAlign: "center" })}
              title="Align Center"
              disabled={disabled}
            >
              ⬌
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title="Align Right"
              disabled={disabled}
            >
              ➡
            </ToolbarButton>
          </div>

          {/* Insert */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={handleImageUpload}
              title="Insert Image"
              disabled={disabled || isUploading}
            >
              {isUploading ? "⏳" : "🖼️"}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setLinkModalOpen(true)}
              isActive={editor.isActive("link")}
              title="Insert Link"
              disabled={disabled}
            >
              🔗
            </ToolbarButton>
            <ToolbarButton
              onClick={handleMathInsert}
              title="Insert Math (LaTeX)"
              disabled={disabled}
            >
              <span className="font-semibold">Σ</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setSpecialCharsOpen(true)}
              title="Insert Special Character"
              disabled={disabled}
            >
              Ω
            </ToolbarButton>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              title="Clear Formatting"
              disabled={disabled}
            >
              Clear
            </ToolbarButton>
          </div>
        </div>

        {uploadProgress && (
          <div className="mt-2 text-xs text-blue-600">{uploadProgress}</div>
        )}
      </div>

      {/* Editor content */}
      <div
        className={`border border-gray-300 rounded-b-lg bg-white ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Modals */}
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onInsert={handleLinkInsert}
        initialUrl={editor.isActive("link") ? editor.getAttributes("link").href : ""}
      />
      <SpecialCharsModal
        isOpen={specialCharsOpen}
        onClose={() => setSpecialCharsOpen(false)}
        onInsert={handleSpecialCharInsert}
      />
    </div>
  );
}
