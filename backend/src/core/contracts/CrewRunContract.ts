import { z } from 'zod';
import { crewRunInputSchema, crewRunOutputSchema } from '../crew/types.js';

export { crewRunInputSchema, crewRunOutputSchema };

export type CrewRunContractInput = z.infer<typeof crewRunInputSchema>;
export type CrewRunContractOutput = z.infer<typeof crewRunOutputSchema>;

export function validateCrewRunInput(input: unknown): CrewRunContractInput {
  return crewRunInputSchema.parse(input);
}

export function validateCrewRunOutput(output: unknown): CrewRunContractOutput {
  return crewRunOutputSchema.parse(output);
}
