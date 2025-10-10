import React from 'react';
import BatchPricingCalculator from '../components/BatchPricingCalculator';

const BatchPricingCalculatorPage = () => {
  const handlePricingComplete = (pricingData) => {
    console.log('Pricing calculation completed:', pricingData);
    // Aqui você pode adicionar lógica adicional quando o cálculo for concluído
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <BatchPricingCalculator onPricingComplete={handlePricingComplete} />
      </div>
    </div>
  );
};

export default BatchPricingCalculatorPage;
