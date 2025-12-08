
'use server';
/**
 * @fileOverview A flow for generating a high-quality employee I-Card image.
 *
 * - generateIdCardImage - A function that takes employee details and returns an image URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initialCompanies, locations } from '@/lib/mock-data';

const companyNames = initialCompanies.map(c => c.name) as [string, ...string[]];
const locationKeys = Object.keys(locations) as [string, ...string[]];

const IdCardInputSchema = z.object({
    employee: z.object({
        id: z.string(),
        name: z.string(),
        designation: z.string().optional(),
        status: z.string(),
        bloodGroup: z.string().optional(),
        avatar: z.string().describe("A URL or a seed for a placeholder image."),
        company: z.enum(companyNames).optional(),
        location: z.enum(locationKeys).optional(),
        emergencyContact: z.string().optional(),
      })
});
export type IdCardInput = z.infer<typeof IdCardInputSchema>;

const IdCardOutputSchema = z.object({
  mediaUrl: z.string().describe("The data URI of the generated I-Card image in PNG format."),
});
export type IdCardOutput = z.infer<typeof IdCardOutputSchema>;


export async function generateIdCardImage(input: IdCardInput): Promise<IdCardOutput> {
  const result = await generateIdCardFlow(input);
  return result;
}

const getCompanyDetails = (input: IdCardInput) => {
    const company = initialCompanies.find(c => c.name === input.employee.company);
    const address = input.employee.location ? locations[input.employee.location] : 'N/A';
    return {
        name: company?.name || "Company Name",
        shortName: company?.shortName || "CN",
        address: address,
    };
}

const getAvatarUrl = (avatarSeed: string) => {
    if (avatarSeed && avatarSeed.startsWith('data:image')) {
        return avatarSeed;
    }
    return `https://picsum.photos/seed/${avatarSeed}/320/270`;
}

const promptInputSchema = z.object({
    employee: IdCardInputSchema.shape.employee,
    finalAvatarUrl: z.string(),
    companyName: z.string(),
    companyAddress: z.string(),
    qrCodeValue: z.string().optional(),
});


const prompt = ai.definePrompt({
  name: 'generateIdCardPrompt',
  input: { schema: promptInputSchema },
  output: { schema: IdCardOutputSchema },
  model: 'googleai/imagen-4.0-fast-generate-001',
  prompt: `Generate a photorealistic, professional employee ID card with a final image resolution of 640x1080 pixels (portrait orientation).

The ID card must be vertically oriented and have a clean, modern design. It must contain the exact information provided below, rendered clearly and legibly.

**CARD STRUCTURE AND CONTENT:**

1.  **Top Section (Photo Area):**
    *   The top half of the card must be a high-quality, professional headshot of the employee. Use the following image as the primary photo: {{media url=finalAvatarUrl}}
    *   In the top-left corner, overlay a small, circular company logo. Use the ASE Engineers logo (a blue hexagon with white and yellow lines inside). The logo should be inside a white circle for visibility.

2.  **Middle Section (Employee Details):**
    *   This section is below the photo and has a clean white background.
    *   **Employee Name:** Centered, in a large, bold, dark gray font. Text: "{{employee.name}}"
    *   **Designation:** Centered, directly below the name, in a smaller, medium-weight gray font. Text: "{{employee.designation}}"
    *   **Details Grid:** A three-column grid for other details:
        *   **Left Column (Labels):** Right-aligned text in a medium gray font. The labels are "Emp. Code", "Status", "Blood Group".
        *   **Center Column (QR Code):** A standard QR code graphic. The QR code should visually represent the data "{{qrCodeValue}}".
        *   **Right Column (Values):** Left-aligned text in a bold, dark gray font.
            *   Emp. Code value: "{{employee.id}}"
            *   Status value: "{{employee.status}}". This text must be colored based on the status: green for "active", red for "inactive", and orange for "pending".
            *   Blood Group value: "{{employee.bloodGroup}}". It should have a small red droplet icon next to it.

3.  **Footer Section (Company Info):**
    *   This is the bottom-most section of the card.
    *   It must have a solid, dark charcoal gray background (#2d3748).
    *   **Company Name:** Centered, in a white, bold font. Text: "{{companyName}}"
    *   **Company Address:** Centered, directly below the company name, in a smaller, light gray font. Text: "{{companyAddress}}"

**Design requirements:**
*   Use a modern, sans-serif font like Inter or Helvetica throughout.
*   The layout must be perfectly balanced and professional.
*   The final output MUST be a single, complete I-Card image. Do not generate separate elements.
*   Ensure high contrast for all text for readability.
`,
  });

const generateIdCardFlow = ai.defineFlow(
  {
    name: 'generateIdCardFlow',
    inputSchema: IdCardInputSchema,
    outputSchema: IdCardOutputSchema,
  },
  async (input) => {
    const companyDetails = getCompanyDetails(input);
    const finalAvatarUrl = getAvatarUrl(input.employee.avatar);

    const promptInput = {
      employee: input.employee,
      finalAvatarUrl: finalAvatarUrl,
      companyName: companyDetails.name,
      companyAddress: companyDetails.address,
      qrCodeValue: input.employee.emergencyContact ? `tel:${input.employee.emergencyContact}`: `Employee: ${input.employee.name}`,
    };

    const { output } = await prompt(promptInput);

    if (!output?.mediaUrl) {
      throw new Error("Failed to generate I-Card image. The model did not return any media.");
    }
    
    return { mediaUrl: output.mediaUrl };
  }
);
