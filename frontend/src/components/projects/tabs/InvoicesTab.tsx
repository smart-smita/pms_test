import React from 'react';
import { Invoices } from '../../../pages/Invoices';

interface InvoicesTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ projectId }) => {
  return (
    <Invoices projectId={projectId} />
  );
};
