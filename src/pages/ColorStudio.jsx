import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InteractiveTimeline from '@/components/InteractiveTimeline';
import ClipOptionsPanel from '@/components/ClipOptionsPanel';
import AudioManager from '@/components/AudioManager';
import ColoristDashboard from '@/components/ColoristDashboard';
import BatchPricingCalculator from '@/components/BatchPricingCalculator';
import StreamUploader from '@/components/StreamUploader';
import LUTLibrary from '@/components/LUTLibrary';

const ColorStudio = () => {
  const [selectedClip, setSelectedClip] = useState(null);
  const [clips, setClips] = useState([]);
  const [projectType, setProjectType] = useState('SDR');
  const [availableLuts, setAvailableLuts] = useState([]);
  const [audioConfig, setAudioConfig] = useState({
    source: 'video',
    url: null,
    file: null
  });

  const handleClipSelect = (clip) => {
    setSelectedClip(clip);
  };

  const handleClipUpdate = (updatedClip) => {
    setClips(clips.map(c => c.id === updatedClip.id ? updatedClip : c));
    setSelectedClip(updatedClip);
  };

  const handleAudioChange = (audioData) => {
    setAudioConfig(audioData);
  };

  const handleUploadComplete = (uploadedClips) => {
    setClips([...clips, ...uploadedClips]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Color Studio</h1>
          <p className="text-gray-600">Professional Color Grading Workflow</p>
        </div>
      </div>

      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="client">Client View</TabsTrigger>
          <TabsTrigger value="colorist">Colorist Dashboard</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Calculator</TabsTrigger>
          <TabsTrigger value="library">LUT Library</TabsTrigger>
        </TabsList>

        {/* Client View */}
        <TabsContent value="client" className="space-y-6">
          {/* Upload Section */}
          <StreamUploader onUploadComplete={handleUploadComplete} />

          {/* Timeline & Player */}
          {clips.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InteractiveTimeline
                  clips={clips}
                  onClipSelect={handleClipSelect}
                  selectedClipId={selectedClip?.id}
                  audioUrl={audioConfig.url}
                  onAudioChange={handleAudioChange}
                />
              </div>

              <div className="space-y-6">
                {/* Clip Options */}
                <ClipOptionsPanel
                  clip={selectedClip}
                  onUpdate={handleClipUpdate}
                  onClose={() => setSelectedClip(null)}
                  availableLuts={availableLuts}
                  projectType={projectType}
                />

                {/* Audio Manager */}
                <AudioManager
                  videoHasAudio={selectedClip?.has_audio}
                  externalAudioUrl={audioConfig.url}
                  onAudioChange={handleAudioChange}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Colorist Dashboard */}
        <TabsContent value="colorist">
          <ColoristDashboard coloristEmail="colorist@example.com" />
        </TabsContent>

        {/* Pricing Calculator */}
        <TabsContent value="pricing">
          <BatchPricingCalculator
            onPricingComplete={(pricing) => {
              console.log('Pricing calculated:', pricing);
            }}
          />
        </TabsContent>

        {/* LUT Library */}
        <TabsContent value="library">
          <LUTLibrary
            onLutSelect={(lut) => {
              setAvailableLuts([...availableLuts, lut]);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ColorStudio;

