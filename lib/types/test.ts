// lib/types/test.ts
import type { Timestamp } from "firebase/firestore";

/**
 * Question reference within a test
 * Contains only the question ID and scoring information
 */
export interface TestQuestion {
  questionId: string;      // Reference to question document ID
  marks: number;           // Marks for this question in this test
  negativeMarks: number;   // Negative marking for this question (0 if none)
  order: number;           // Order/position of question in the test
  sectionId: string;       // ID of the section this question belongs to
  subsectionId: string;   // ID of the subsection this question belongs to
}

/**
 * Subsection within a section (e.g., "MCQ", "Numerical")
 */
export interface TestSubsection {
  id: string;              // Unique ID for the subsection
  name: string;            // Name of the subsection (e.g., "MCQ", "Numerical")
  order: number;           // Order within the section
}

/**
 * Section within a test (e.g., "Physics", "Chemistry", "Maths")
 */
export interface TestSection {
  id: string;              // Unique ID for the section
  name: string;            // Name of the section (e.g., "Physics", "Chemistry")
  order: number;           // Order in the test
  subsections: TestSubsection[];  // Subsections within this section
}

/**
 * Test document in Firestore
 */
export interface TestDoc {
  title: string;
  description: string;
  durationMinutes: number;
  sections: TestSection[];  // Sections with subsections
  questions: TestQuestion[];  // Questions with section/subsection references
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;      // admin UID
}

/**
 * Test with document ID included
 */
export interface Test extends TestDoc {
  id: string;
}

/**
 * Input type for creating/updating a test from forms (before timestamps)
 */
export interface TestInput {
  title: string;
  description: string;
  durationMinutes: number;
  sections: TestSection[];
  questions: TestQuestion[];
}







