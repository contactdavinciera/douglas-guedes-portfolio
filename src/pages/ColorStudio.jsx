import React from 'react';

const ColorStudio = () => {
  const videoId = '43ac71972b501547f8a9ddd87f51725e';
  const customerCode = '5dr3ublgoe3wg2wj';

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-red-500">Color Studio - Teste de Iframe Cloudflare Stream</h1>
        <p className="text-center text-lg text-gray-300 mt-4">Abaixo deve aparecer um vídeo do Cloudflare Stream.</p>
        <div className="mt-8 flex justify-center">
          <iframe
            src={`https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe`}
            style={{ border: 'none', width: '800px', height: '450px' }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen={true}
            title="Cloudflare Stream Video"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default ColorStudio;

