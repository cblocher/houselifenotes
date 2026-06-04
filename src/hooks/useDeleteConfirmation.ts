import { useState } from 'react';

interface DeleteConfirmationState {
  isOpen: boolean;
  type: string | null;
  id: string | null;
  itemName: string;
  extraData?: Record<string, unknown>;
}

export function useDeleteConfirmation() {
  const [state, setState] = useState<DeleteConfirmationState>({
    isOpen: false,
    type: null,
    id: null,
    itemName: '',
  });

  const openDeleteConfirmation = (type: string, id: string, itemName: string, extraData?: Record<string, unknown>) => {
    setState({
      isOpen: true,
      type,
      id,
      itemName,
      extraData,
    });
  };

  const closeDeleteConfirmation = () => {
    setState({
      isOpen: false,
      type: null,
      id: null,
      itemName: '',
      extraData: undefined,
    });
  };

  return {
    deleteConfirmation: state,
    openDeleteConfirmation,
    closeDeleteConfirmation,
  };
}
