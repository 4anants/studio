
'use server';
/**
 * @fileOverview A flow for classifying documents and assigning them to employees.
 *
 * - classifyDocuments - A function that takes a list of document names and employees and returns the classification.
 */

import { ai } from '@/ai/genkit';
import {
  ClassifyDocumentsInputSchema,
  type ClassifyDocumentsInput,
  ClassifyDocumentsOutputSchema,
  type ClassifyDocumentsOutput,
} from './classify-documents-types';

export async function classifyDocuments(input: ClassifyDocumentsInput): Promise<ClassifyDocumentsOutput> {
  if (input.documents.length === 0) {
    return [];
  }
  const result = await classifyDocumentsFlow(input);
  
  // Genkit output might not be in the same order as input, so we remap it.
  return input.documents.map(doc => {
    const found = result.find(r => r.originalFilename === doc.filename);
    if (found) {
        return found;
    }
    return {
        originalFilename: doc.filename,
        error: "Processing failed for this file."
    }
  });
}

const prompt = ai.definePrompt({
  name: 'classifyDocumentsPrompt',
  input: { schema: ClassifyDocumentsInputSchema },
  output: { schema: ClassifyDocumentsOutputSchema },
  prompt: `You are an intelligent HR assistant responsible for organizing employee documents.
You will be given a list of documents (including their content) and a list of employees with their names and unique employee codes (IDs).
Your task is to analyze each document's content and filename to determine which employee it belongs to and what type of document it is.

- Match the name or employee code (ID) found in the document content or filename to the closest employee from the provided list. Prioritize matching by employee code if it is present in the document.
- Infer the document type from the document's content and title. Common types are: Salary Slip, Medical Report, Appraisal Letter, Personal.
- For each document, you MUST return an object with the originalFilename, the matched employeeId, and the determined documentType.
- If a document is already partially classified (e.g., employee is known but type is not), focus only on filling in the missing information.
- If you cannot confidently determine the employee or the document type for a file, you should still return an entry for it, but set employeeId or documentType to null and provide a reason in the 'error' field.
- It is critical that you return one result object for each and every document in the input array.

Available Employees:
{{#each employees}}
- Name: {{name}}, Code: {{id}}
{{/each}}

Documents to classify:
{{#each documents}}
---
Filename: {{{filename}}}
Content:
{{media url=dataUri}}
---
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
