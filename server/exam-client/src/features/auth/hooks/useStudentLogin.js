import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';

export const useStudentLogin = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async ({ rollNumber, password }) => {
      return login(rollNumber, password);
    },
  });
};
