// components/ui/toast/use-toast.js
import { useState } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = ({ title, description, variant = 'default' }) => {
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000); // Hide after 3 seconds
  };

  return { toast, showToast };
};
