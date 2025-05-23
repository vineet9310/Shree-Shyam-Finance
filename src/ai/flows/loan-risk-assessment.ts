// 'use server';

/**
 * @fileOverview Loan risk assessment AI agent.
 *
 * - assessLoanRisk - A function that handles the loan risk assessment process.
 * - AssessLoanRiskInput - The input type for the assessLoanRisk function.
 * - AssessLoanRiskOutput - The return type for the assessLoanRisk function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessLoanRiskInputSchema = z.object({
  applicationData: z
    .string()
    .describe('The loan application data as a JSON string.'),
  supportingDocuments: z
    .array(z.string())
    .describe(
      'An array of supporting documents for the loan application, as data URIs that must include a MIME type and use Base64 encoding. Expected format: [\'data:<mimetype>;base64,<encoded_data>\', ...].'
    ),
});
export type AssessLoanRiskInput = z.infer<typeof AssessLoanRiskInputSchema>;

const AssessLoanRiskOutputSchema = z.object({
  riskAssessment: z
    .string()
    .describe('The risk assessment of the loan application.'),
  riskScore: z.number().describe('A numerical risk score for the loan.'),
  recommendedAction: z
    .string()
    .describe('The recommended action for the loan application.'),
});
export type AssessLoanRiskOutput = z.infer<typeof AssessLoanRiskOutputSchema>;

export async function assessLoanRisk(input: AssessLoanRiskInput): Promise<AssessLoanRiskOutput> {
  return assessLoanRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessLoanRiskPrompt',
  input: {schema: AssessLoanRiskInputSchema},
  output: {schema: AssessLoanRiskOutputSchema},
  prompt: `You are an AI loan risk assessment tool. You are provided with loan application data and supporting documents.

  Assess the risk associated with the loan and provide a risk score, risk assessment, and recommended action.

  Loan Application Data: {{{applicationData}}}

  Supporting Documents:
  {{#each supportingDocuments}}
  {{media url=this}}
  {{/each}}
  `,
});

const assessLoanRiskFlow = ai.defineFlow(
  {
    name: 'assessLoanRiskFlow',
    inputSchema: AssessLoanRiskInputSchema,
    outputSchema: AssessLoanRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
