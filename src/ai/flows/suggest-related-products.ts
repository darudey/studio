'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting related products based on the items in a shopping cart.
 *
 * - suggestRelatedProducts - A function that takes an array of product names and returns a list of related product suggestions.
 * - SuggestRelatedProductsInput - The input type for the suggestRelatedProducts function.
 * - SuggestRelatedProductsOutput - The return type for the suggestRelatedProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedProductsInputSchema = z.object({
  cartItems: z.array(
    z.string().describe('The name of an item currently in the shopping cart.')
  ).describe('A list of items in the shopping cart.'),
  maxSuggestions: z.number().optional().default(3).describe('The maximum number of related product suggestions to return.'),
  conditionalThreshold: z.number().optional().default(0.5).describe('The threshold for the LLM to decide whether to provide suggestions. If the LLM is less confident than this, it should return an empty array.')
});
export type SuggestRelatedProductsInput = z.infer<typeof SuggestRelatedProductsInputSchema>;

const SuggestRelatedProductsOutputSchema = z.array(
  z.string().describe('A suggested related product name.')
).describe('A list of suggested related products.');
export type SuggestRelatedProductsOutput = z.infer<typeof SuggestRelatedProductsOutputSchema>;

export async function suggestRelatedProducts(input: SuggestRelatedProductsInput): Promise<SuggestRelatedProductsOutput> {
  return suggestRelatedProductsFlow(input);
}

const suggestRelatedProductsPrompt = ai.definePrompt({
  name: 'suggestRelatedProductsPrompt',
  input: {schema: SuggestRelatedProductsInputSchema},
  output: {schema: SuggestRelatedProductsOutputSchema},
  prompt: `You are an e-commerce expert specializing in suggesting related products to customers based on their current shopping cart items.

You will receive a list of items in the customer's shopping cart and should suggest related products that the customer might be interested in purchasing.

Consider products that are frequently bought together, complementary items, or items that enhance the functionality of the existing cart items.

If you are not confident in any suggestions given the context, return an empty array. The confidence threshold is {{{conditionalThreshold}}}.

Cart Items:
{{#each cartItems}}- {{{this}}}
{{/each}}

Related Product Suggestions:`, 
});

const suggestRelatedProductsFlow = ai.defineFlow(
  {
    name: 'suggestRelatedProductsFlow',
    inputSchema: SuggestRelatedProductsInputSchema,
    outputSchema: SuggestRelatedProductsOutputSchema,
  },
  async input => {
    const {output} = await suggestRelatedProductsPrompt(input);
    return output!;
  }
);
