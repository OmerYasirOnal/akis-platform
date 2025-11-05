import { useState } from 'react';
import { api } from '../services/api';
import type { CreateJobRequest, CreateJobResponse } from '../services/api';

export function useCreateJob() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<(CreateJobResponse & { requestId?: string }) | null>(
    null
  );

  const createJob = async (request: CreateJobRequest) => {
    setIsSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const result = await api.createJob(request);
      setResponse(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create job');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createJob,
    isSubmitting,
    error,
    response,
  };
}
