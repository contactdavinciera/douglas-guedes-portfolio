import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  MapPin,
  Palette,
  Info,
  CheckCircle2
} from 'lucide-react';

const ClipOptionsPanel = ({ 
  clip, 
  onUpdate, 
  onClose,
  availableLuts = [],
  projectType = 'SDR'
}) => {
  const [clipData, setClipData] = useState(clip || {});
  const [markers, setMarkers] = useState(clip?.markers || []);
  const [selectedLut, setSelectedLut] = useState(clip?.selected_lut || '');
  const [customLutFile, setCustomLutFile] = useState(null);
  const [notes, setNotes] = useState(clip?.notes || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setClipData(clip || {});
    setMarkers(clip?.markers || []);
    setSelectedLut(clip?.selected_lut || '');
    setNotes(clip?.notes || '');
  }, [clip]);

  const handleSave = () => {
    const updatedClip = {
      ...clipData,
      selected_lut: selectedLut,
      markers: markers,
      notes: notes,
      custom_lut_file: customLutFile
    };
    
    onUpdate && onUpdate(updatedClip);
    setHasChanges(false);
  };

  const addMarker = () => {
    const newMarker = {
      id: Date.now(),
      time: 0,
      type: 'note',
      text: '',
      color: '#FFD700'
    };
    setMarkers([...markers, newMarker]);
    setHasChanges(true);
  };

  const updateMarker = (markerId, field, value) => {
    setMarkers(markers.map(m => 
      m.id === markerId ? { ...m, [field]: value } : m
    ));
    setHasChanges(true);
  };

  const deleteMarker = (markerId) => {
    setMarkers(markers.filter(m => m.id !== markerId));
    setHasChanges(true);
  };

  const handleLutChange = (lutId) => {
    setSelectedLut(lutId);
    setHasChanges(true);
  };

  const handleCustomLutUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomLutFile(file);
      setHasChanges(true);
    }
  };

  if (!clip) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Selecione um clip na timeline para editar suas opções</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{clip.name || 'Clip Options'}</CardTitle>
            <CardDescription>
              {clip.resolution} • {clip.codec} • {clip.duration}s
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Clip Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
          <div>
            <p className="text-xs text-gray-600">Color Space</p>
            <p className="font-medium">{clip.color_space || 'Rec.709'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Gamma</p>
            <p className="font-medium">{clip.gamma || 'Gamma 2.4'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Bit Depth</p>
            <p className="font-medium">{clip.bit_depth || 8} bit</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">FPS</p>
            <p className="font-medium">{clip.fps || 24}</p>
          </div>
        </div>

        <Tabs defaultValue="lut" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lut">
              <Palette className="h-4 w-4 mr-2" />
              LUT
            </TabsTrigger>
            <TabsTrigger value="markers">
              <MapPin className="h-4 w-4 mr-2" />
              Markers
            </TabsTrigger>
            <TabsTrigger value="notes">
              <Info className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* LUT Selection Tab */}
          <TabsContent value="lut" className="space-y-4">
            <div className="space-y-2">
              <Label>Select LUT</Label>
              <Select value={selectedLut} onValueChange={handleLutChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a LUT..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No LUT</SelectItem>
                  {availableLuts.map((lut) => (
                    <SelectItem key={lut.id} value={lut.id}>
                      {lut.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLut && selectedLut !== 'none' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  LUT selecionada: <strong>
                    {availableLuts.find(l => l.id === selectedLut)?.name}
                  </strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <Label>Upload Custom LUT</Label>
              <p className="text-xs text-gray-600 mb-2">
                Suporta .cube, .3dl files
              </p>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".cube,.3dl"
                  onChange={handleCustomLutUpload}
                  className="flex-1"
                />
                {customLutFile && (
                  <Badge variant="secondary">
                    {customLutFile.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* LUT Preview */}
            <div className="space-y-2">
              <Label>LUT Preview</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-video bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  Before
                </div>
                <div className="aspect-video bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  After
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Markers Tab */}
          <TabsContent value="markers" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Markers ({markers.length})</Label>
              <Button size="sm" onClick={addMarker}>
                <Plus className="h-4 w-4 mr-1" />
                Add Marker
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {markers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum marker adicionado</p>
                </div>
              ) : (
                markers.map((marker) => (
                  <Card key={marker.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Time (s)"
                          value={marker.time}
                          onChange={(e) => updateMarker(marker.id, 'time', parseFloat(e.target.value))}
                          className="w-24"
                        />
                        <Select
                          value={marker.type}
                          onValueChange={(val) => updateMarker(marker.id, 'type', val)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="note">Note</SelectItem>
                            <SelectItem value="issue">Issue</SelectItem>
                            <SelectItem value="approval">Approval</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMarker(marker.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Marker text..."
                        value={marker.text}
                        onChange={(e) => updateMarker(marker.id, 'text', e.target.value)}
                      />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-2">
              <Label>Clip Notes</Label>
              <Textarea
                placeholder="Adicione notas sobre este clip..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setHasChanges(true);
                }}
                rows={8}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Estas notas serão visíveis para o colorista durante o processo de grading.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            className="flex-1" 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {hasChanges && (
          <Alert variant="warning">
            <AlertDescription>
              Você tem alterações não salvas
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ClipOptionsPanel;
