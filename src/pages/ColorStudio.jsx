import React from 'react';

const ColorStudio = () => {
  console.log('ColorStudio: Componente de teste carregado');
  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-red-500">Color Studio Teste de Renderização</h1>
        <p className="text-center text-lg text-gray-300 mt-4">Se você está vendo isso, o React está funcionando!</p>
      </div>
    </div>
  );
};

export default ColorStudio;

