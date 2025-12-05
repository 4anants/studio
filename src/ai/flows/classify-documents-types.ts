/**
 * @fileOverview Types and Zod schemas for the document classification flow.
 *
 * - ClassifyDocumentsInputSchema - The Zod schema for the input.
 * - ClassifyDocumentsInput - The TypeScript type for the input.
 * - ClassifyDocumentsOutputSchema - The Zod schema for the output.
 * - ClassifyDocumentsOutput - The TypeScript type for the output.
 */

import { z } from 'genkit';

const EmployeeSchema = z.object({
  id: z.string().describe('The unique identifier for the employee.'),
  name: z.string().describe('The full name of the employee.'),
});

const DocumentInputSchema = z.object({
  filename: z.string().describe('The original filename of the document.'),
  dataUri: z.string().describe("The document content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export const ClassifyDocumentsInputSchema = z.object({
  documents: z.array(DocumentInputSchema).describe('An array of documents to classify, including their content.'),
  employees: z.array(EmployeeSchema).describe('An array of available employees.'),
});
export type ClassifyDocumentsInput = z.infer<typeof ClassifyDocumentsInputSchema>;

const DocumentClassificationResultSchema = z.object({
  originalFilename: z.string().describe('The original filename of the document.'),
  employeeId: z
    .string()
    .optional()
    .describe('The ID of the employee this document belongs to. If no match is found, this can be null.'),
  documentType: z
    .string()
    .optional()
    .describe(
      'The type of the document (e.g., "Salary Slip", "Medical Report", "Appraisal Letter", "Personal"). If it cannot be determined, this can be null.'
    ),
  error: z.string().optional().describe('An error message if classification failed for this document.'),
});

export const ClassifyDocumentsOutputSchema = z.array(DocumentClassificationResultSchema);
export type ClassifyDocumentsOutput = z.infer<typeof ClassifyDocumentsOutputSchema>;
