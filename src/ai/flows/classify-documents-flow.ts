'use server';
/**
 * @fileOverview A flow for classifying documents and assigning them to employees.
 *
 * - classifyDocuments - A function that takes a list of document names and employees and returns the classification.
 * - ClassifyDocumentsInput - The input type for the classifyDocuments function.
 * - ClassifyDocumentsOutput - The return type for the classifyDocuments function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EmployeeSchema = z.object({
  id: z.string().describe('The unique identifier for the employee.'),
  name: z.string().describe('The full name of the employee.'),
});

export const ClassifyDocumentsInputSchema = z.object({
  documents: z.array(z.string()).describe('An array of document filenames.'),
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


export async function classifyDocuments(input: ClassifyDocumentsInput): Promise<ClassifyDocumentsOutput> {
  const result = await classifyDocumentsFlow(input);
  
  // Genkit output might not be in the same order as input, so we remap it.
  return input.documents.map(filename => {
    const found = result.find(r => r.originalFilename === filename);
    if (found) {
        return found;
    }
    return {
        originalFilename: filename,
        error: "Processing failed for this file."
    }
  });
}

const prompt = ai.definePrompt({
  name: 'classifyDocumentsPrompt',
  input: { schema: ClassifyDocumentsInputSchema },
  output: { schema: ClassifyDocumentsOutputSchema },
  prompt: `You are an intelligent HR assistant responsible for organizing employee documents.
You will be given a list of document filenames and a list of employees.
Your task is to analyze each filename and determine which employee it belongs to and what type of document it is.

- Match the name in the filename to the closest employee name from the provided list. The filename may contain partial names, nicknames, or be reversed (lastname firstname).
- Infer the document type from the filename. Common types are: Salary Slip, Medical Report, Appraisal Letter, Personal.
- For each document, you MUST return an object with the originalFilename, the matched employeeId, and the determined documentType.
- If you cannot confidently determine the employee or the document type for a file, you should still return an entry for it, but set employeeId or documentType to null and provide a reason in the 'error' field.
- It is critical that you return one result object for each and every document filename in the input array.

Available Employees:
{{#each employees}}
- {{name}} (ID: {{id}})
{{/each}}

Documents to classify:
{{#each documents}}
- {{{this}}}
{{/each}}
`,
});

const classifyDocumentsFlow = ai.defineFlow(
  {
    name: 'classifyDocumentsFlow',
    inputSchema: ClassifyDocumentsInputSchema,
    outputSchema: ClassifyDocumentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || [];
  }
);
