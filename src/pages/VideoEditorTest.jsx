import React from 'react';

const VideoEditorTest = () => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] pt-20 pb-6 px-4">
      <div className="w-full max-w-[98vw] h-[calc(100vh-7rem)] mx-auto bg-[#262626] rounded-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="h-12 bg-[#1a1a1a] border-b border-gray-700 flex items-center justify-center">
          <span className="text-white font-semibold text-lg">🎼 Maestro Test - Loading...</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl text-white mb-4">✅ Maestro está carregando...</h2>
            <p className="text-gray-400">Se você vê essa mensagem, o React está funcionando!</p>
            <p className="text-green-400 mt-4">O VideoEditor completo está sendo carregado...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorTest;
