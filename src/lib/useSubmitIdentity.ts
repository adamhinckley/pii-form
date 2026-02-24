import { useMutation } from '@tanstack/react-query';
import { submitIdentityForm } from '../api/piiForm';
import type { IdentityFormOutput } from './schema';

export function useSubmitIdentity() {
  return useMutation({
    mutationFn: (data: Omit<IdentityFormOutput, 'consent'>) =>
      submitIdentityForm(data),
  });
}
