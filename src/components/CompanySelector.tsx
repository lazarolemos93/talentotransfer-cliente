"use client";

import React, { useEffect } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { Company } from '@/types/Project';

const CompanySelector: React.FC = () => {
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies } = useAuth();

  useEffect(() => {
    // Set the first company as default when companies are loaded
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany, setSelectedCompany]);

  const handleSelectChange = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
    }
  };

  if (!companies.length) {
    return null;
  }

  return (
    <div className="company-selector p-4 border rounded-md shadow-md">
      <h2 className="text-lg font-semibold mb-2">Selecciona una empresa</h2>
      <div className="mb-4">
        <Select 
          value={selectedCompany?.id} 
          onValueChange={handleSelectChange}
        >
          <SelectTrigger aria-label="Selecciona una empresa">
            <SelectValue placeholder="Selecciona una empresa">
              {selectedCompany?.name || 'Selecciona una empresa'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CompanySelector;
