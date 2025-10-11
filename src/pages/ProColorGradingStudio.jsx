import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedTimeline from '@/components/AdvancedTimeline';
import PrimaryColorCorrection from '@/components/PrimaryColorCorrection';
import IntelligentLUTSelector from '@/components/IntelligentLUTSelector';
import AdvancedMarkerSystem from '@/components/AdvancedMarkerSystem';
import {
  projectApi,
  takeApi,
  colorCorrectionApi,
  lutApi,
  markerApi,
  realtimeSubscriptions
} from '@/services/timelineApi';
import {
  Film,
  Plus,
  Settings,
  Users,
  Save,
  Upload,
  Download,
  Play
} from 'lucide-react';

const ProColorGradingStudio = () => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [takes, setTakes] = useState([]);
  const [selectedTake, setSelectedTake] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [lutLibrary, setLutLibrary] = useState([]);
  const [userRole, setUserRole] = useState('client');
  const [userId, setUserId] = useState('mock-user-id');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectFormat, setNewProjectFormat] = useState('SDR');
  const [clientCorrections, setClientCorrections] = useState(null);
  const [coloristCorrections, setColoristCorrections] = useState(null);
  const [clientLUTs, setClientLUTs] = useState(null);
  const [coloristLUTs, setColoristLUTs] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    loadProjects();
    loadLUTLibrary();
  }, []);

  useEffect(() => {
    if (currentProject) {
      loadProjectData();
    }
  }, [currentProject]);

  useEffect(() => {
    if (selectedTake) {
      loadTakeData();
    }
  }, [selectedTake]);

  useEffect(() => {
    if (currentProject) {
      const unsubscribe = realtimeSubscriptions.subscribeToProject(
        currentProject.id,
        {
          onTakeChange: handleRealtimeTakeChange,
          onMarkerChange: handleRealtimeMarkerChange
        }
      );
      return unsubscribe;
    }
  }, [currentProject]);

  const loadProjects = async () => {
    try {
      const data = await projectApi.list(userId);
      setProjects(data);
      if (data.length > 0 && !currentProject) {
        setCurrentProject(data[0]);
      }
    } catch (error) {
      console.log('Modo DEMO: Iniciando sem projetos');
      // Modo demo - sem projetos iniciais
      setProjects([]);
    }
  };

  const loadProjectData = async () => {
    try {
      const takesData = await takeApi.listByProject(currentProject.id);
      setTakes(takesData);

      const markersData = await markerApi.listByProject(currentProject.id);
      setMarkers(markersData);
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const loadTakeData = async () => {
    try {
      const [clientCC, coloristCC, clientLUT, coloristLUT] = await Promise.all([
        colorCorrectionApi.get(selectedTake.id, 'client'),
        colorCorrectionApi.get(selectedTake.id, 'colorist'),
        lutApi.get(selectedTake.id, 'client'),
        lutApi.get(selectedTake.id, 'colorist')
      ]);

      setClientCorrections(clientCC);
      setColoristCorrections(coloristCC);
      setClientLUTs(clientLUT);
      setColoristLUTs(coloristLUT);
    } catch (error) {
      console.error('Error loading take data:', error);
    }
  };

  const loadLUTLibrary = async () => {
    try {
      const library = await lutApi.listLibrary();
      setLutLibrary(library);
    } catch (error) {
      console.log('Modo DEMO: Biblioteca de LUTs vazia');
      setLutLibrary([]);
    }
  };

  const handleCreateProject = async () => {
    try {
      // Modo DEMO - criar projeto localmente
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName,
        format: newProjectFormat,
        client_id: userId,
        colorist_id: null,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      // Tentar salvar no Supabase, mas continuar mesmo se falhar
      try {
        const savedProject = await projectApi.create({
          name: newProjectName,
          format: newProjectFormat,
          client_id: userId,
          colorist_id: null
        });
        newProject.id = savedProject.id;
      } catch (dbError) {
        console.log('Modo DEMO: Projeto criado apenas localmente');
      }

      setProjects([newProject, ...projects]);
      setCurrentProject(newProject);
      setNewProjectName('');
      setIsCreateProjectOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleTakeAdd = async (takeData) => {
    try {
      const newTake = await takeApi.create({
        ...takeData,
        project_id: currentProject.id,
        order_index: takes.length
      });

      setTakes([...takes, newTake]);
    } catch (error) {
      console.error('Error adding take:', error);
    }
  };

  const handleTakesReorder = async (reorderedTakes) => {
    try {
      await takeApi.reorder(reorderedTakes);
      setTakes(reorderedTakes);
    } catch (error) {
      console.error('Error reordering takes:', error);
    }
  };

  const handleColorCorrectionSave = async (takeId, version, corrections) => {
    try {
      const saved = await colorCorrectionApi.save(takeId, version, corrections);

      if (version === 'client') {
        setClientCorrections(saved);
      } else {
        setColoristCorrections(saved);
      }
    } catch (error) {
      console.error('Error saving color correction:', error);
    }
  };

  const handleLUTSave = async (takeId, version, lutData) => {
    try {
      const saved = await lutApi.save(takeId, version, lutData);

      if (version === 'client') {
        setClientLUTs(saved);
      } else {
        setColoristLUTs(saved);
      }
    } catch (error) {
      console.error('Error saving LUT assignment:', error);
    }
  };

  const handleMarkerAdd = async (markerData) => {
    try {
      const newMarker = await markerApi.create(markerData);
      setMarkers([...markers, newMarker]);
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  };

  const handleMarkerUpdate = async (markerId, updates) => {
    try {
      const updated = await markerApi.update(markerId, updates);
      setMarkers(markers.map(m => m.id === markerId ? updated : m));
    } catch (error) {
      console.error('Error updating marker:', error);
    }
  };

  const handleMarkerDelete = async (markerId) => {
    try {
      await markerApi.delete(markerId);
      setMarkers(markers.filter(m => m.id !== markerId && m.parent_marker_id !== markerId));
    } catch (error) {
      console.error('Error deleting marker:', error);
    }
  };

  const handleMarkerReply = async (replyData) => {
    try {
      const newReply = await markerApi.create(replyData);
      setMarkers([...markers, newReply]);
    } catch (error) {
      console.error('Error replying to marker:', error);
    }
  };

  const handleRealtimeTakeChange = (payload) => {
    console.log('Realtime take change:', payload);
    loadProjectData();
  };

  const handleRealtimeMarkerChange = (payload) => {
    console.log('Realtime marker change:', payload);
    if (currentProject) {
      markerApi.listByProject(currentProject.id).then(setMarkers);
    }
  };

  const getProjectFormatBadge = (format) => {
    const badges = {
      'SDR': { label: 'SDR Rec.709', color: 'bg-gray-600' },
      'HDR_REC2020': { label: 'HDR Rec.2020', color: 'bg-purple-600' },
      'DOLBY_VISION_P3': { label: 'Dolby Vision (P3)', color: 'bg-yellow-600' }
    };
    return badges[format] || badges['SDR'];
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Film className="h-6 w-6 text-blue-400" />
              Bem-vindo ao Color Grading Studio Pro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              Crie um novo projeto para começar ou selecione um existente.
            </p>
            <Button
              onClick={() => setIsCreateProjectOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Projeto
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure o formato de saída e comece a trabalhar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Projeto</Label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Meu Projeto Incrível"
                  className="bg-gray-950 border-gray-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Formato de Saída</Label>
                <Select value={newProjectFormat} onValueChange={setNewProjectFormat}>
                  <SelectTrigger className="bg-gray-950 border-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SDR">SDR (Rec.709)</SelectItem>
                    <SelectItem value="HDR_REC2020">HDR (Rec.2020)</SelectItem>
                    <SelectItem value="DOLBY_VISION_P3">Dolby Vision (P3-D65)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Este formato define o color space de saída do projeto
                </p>
              </div>
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Criar Projeto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const formatBadge = getProjectFormatBadge(currentProject.format);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Film className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {currentProject.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${formatBadge.color} text-xs`}>
                    {formatBadge.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                    {takes.length} takes
                  </Badge>
                  <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                    {markers.length} markers
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-40 bg-gray-900 border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Cliente
                    </div>
                  </SelectItem>
                  <SelectItem value="colorist">
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      Colorista
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setIsCreateProjectOpen(true)}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>

              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <AdvancedTimeline
              projectId={currentProject.id}
              projectFormat={currentProject.format}
              takes={takes}
              onTakesReorder={handleTakesReorder}
              onTakeSelect={setSelectedTake}
              selectedTakeId={selectedTake?.id}
              onMarkerAdd={handleMarkerAdd}
              markers={markers}
              userRole={userRole}
            />
          </div>

          <div className="space-y-6">
            {selectedTake ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                  <TabsTrigger value="timeline" className="text-xs">
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="color" className="text-xs">
                    Cor
                  </TabsTrigger>
                  <TabsTrigger value="luts" className="text-xs">
                    LUTs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4 mt-4">
                  <AdvancedMarkerSystem
                    takeId={selectedTake.id}
                    takeName={selectedTake.name}
                    currentTime={0}
                    fps={selectedTake.fps}
                    markers={markers.filter(m => m.take_id === selectedTake.id)}
                    userRole={userRole}
                    userId={userId}
                    onMarkerAdd={handleMarkerAdd}
                    onMarkerUpdate={handleMarkerUpdate}
                    onMarkerDelete={handleMarkerDelete}
                    onMarkerReply={handleMarkerReply}
                  />
                </TabsContent>

                <TabsContent value="color" className="space-y-4 mt-4">
                  <PrimaryColorCorrection
                    takeId={selectedTake.id}
                    takeName={selectedTake.name}
                    version={userRole}
                    initialValues={userRole === 'client' ? clientCorrections : coloristCorrections}
                    onSave={(values) => handleColorCorrectionSave(selectedTake.id, userRole, values)}
                  />
                </TabsContent>

                <TabsContent value="luts" className="space-y-4 mt-4">
                  <IntelligentLUTSelector
                    takeId={selectedTake.id}
                    takeName={selectedTake.name}
                    takeColorSpace={selectedTake.color_space}
                    takeGamma={selectedTake.gamma}
                    projectFormat={currentProject.format}
                    version={userRole}
                    currentLUTs={userRole === 'client' ? clientLUTs : coloristLUTs}
                    lutLibrary={lutLibrary}
                    onSave={(lutData) => handleLUTSave(selectedTake.id, userRole, lutData)}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">
                    Selecione um take na timeline para editar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProColorGradingStudio;
