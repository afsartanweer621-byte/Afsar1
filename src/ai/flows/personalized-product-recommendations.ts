
'use server';
/**
 * @fileOverview An AI agent that provides personalized footwear recommendations to retailers on Mochibazaar.
 *
 * - personalizedProductRecommendations - A function that handles the shoe recommendation process.
 * - PersonalizedProductRecommendationsInput - The input type for the personalizedProductRecommendations function.
 * - PersonalizedProductRecommendationsOutput - The return type for the personalizedProductRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedProductRecommendationsInputSchema = z.object({
  pastPurchases: z.array(z.string()).describe('A list of footwear styles or SKU categories previously purchased by the retailer.'),
  browsingHistory: z.array(z.string()).describe('A list of shoe types, brands, or materials the retailer has recently browsed.'),
  similarRetailerTrends: z.array(z.string()).describe('A list of trending footwear styles among similar retailers.'),
});
export type PersonalizedProductRecommendationsInput = z.infer<typeof PersonalizedProductRecommendationsInputSchema>;

const PersonalizedProductRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      productId: z.string().optional().describe('Optional product ID or SKU.'),
      productName: z.string().describe('The name of the recommended footwear.'),
      description: z.string().describe('A brief wholesale-focused description.'),
    })
  ).describe('A list of personalized footwear recommendations.'),
});
export type PersonalizedProductRecommendationsOutput = z.infer<typeof PersonalizedProductRecommendationsOutputSchema>;

export async function personalizedProductRecommendations(input: PersonalizedProductRecommendationsInput): Promise<PersonalizedProductRecommendationsOutput> {
  return personalizedProductRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedProductRecommendationsPrompt',
  input: { schema: PersonalizedProductRecommendationsInputSchema },
  output: { schema: PersonalizedProductRecommendationsOutputSchema },
  prompt: `You are an expert luxury footwear buyer and inventory consultant for Mochibazaar, a premium B2B wholesale platform. Your goal is to suggest high-end footwear styles (Loafers, Chelsea Boots, Minimalist Sneakers) to boutique retailers.

Consider the following information about the retailer:

Past Wholesale Orders:
{{#if pastPurchases}}
{{#each pastPurchases}}- {{{this}}}
{{/each}}
{{else}}No past footwear orders provided.
{{/if}}

SKU Browsing Interest:
{{#if browsingHistory}}
{{#each browsingHistory}}- {{{this}}}
{{/each}}
{{else}}No browsing history provided.
{{/if}}

Market Trends (Luxury Footwear):
{{#if similarRetailerTrends}}
{{#each similarRetailerTrends}}- {{{this}}}
{{/each}}
{{else}}No footwear trends provided.
{{/if}}

Based on this, recommend 3 specific footwear styles that would fit a luxury boutique's inventory. Focus on silhouettes like Goodyear-welted loafers, Italian leather boots, or premium leather trainers. Provide a professional product name and a brief description focused on materials (calfskin, suede), construction, and market demand for retailers.
`,
});

const personalizedProductRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedProductRecommendationsFlow',
    inputSchema: PersonalizedProductRecommendationsInputSchema,
    outputSchema: PersonalizedProductRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
