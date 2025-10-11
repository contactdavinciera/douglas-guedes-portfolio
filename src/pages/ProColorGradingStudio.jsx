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
import VideoPlayer from '@/components/VideoPlayer';
import VisualTimeline from '@/components/VisualTimeline';
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
  Play,
  Flame,
  Palette,
  MessageSquare,
  Eye,
  List,
  Grid3x3,
  ArrowUpDown
} from 'lucide-react';

const MaestroColorStudio = () => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [takes, setTakes] = useState([]);
  const [selectedTake, setSelectedTake] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [lutLibrary, setLutLibrary] = useState([]);
  const [userRole, setUserRole] = useState('client');
  const [userId, setUserId] = useState('00000000-0000-0000-0000-000000000001'); // UUID válido temporário
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectFormat, setNewProjectFormat] = useState('SDR');
  const [newProjectAspectRatio, setNewProjectAspectRatio] = useState('16:9');
  const [clientCorrections, setClientCorrections] = useState(null);
  const [coloristCorrections, setColoristCorrections] = useState(null);
  const [clientLUTs, setClientLUTs] = useState(null);
  const [coloristLUTs, setColoristLUTs] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [isAddTakeOpen, setIsAddTakeOpen] = useState(false);
  const [newTakeName, setNewTakeName] = useState('');
  const [uploadingTake, setUploadingTake] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Workspace mode: 'forja' (editing), 'atelie' (color grading), or 'revisao' (review/approval)
  const [workspaceMode, setWorkspaceMode] = useState('forja');
  
  // Review mode settings
  const [reviewColorMode, setReviewColorMode] = useState('none'); // 'none', 'client', 'colorist'
  
  // Media Pool settings
  const [mediaPoolView, setMediaPoolView] = useState('list'); // 'grid' or 'list' - DEFAULT: lista
  const [mediaPoolSort, setMediaPoolSort] = useState('name'); // 'name' or 'timecode'
  
  // Editing Tools state
  const [editMode, setEditMode] = useState('select'); // 'select' | 'razor' | 'trim'
  const [selectedClips, setSelectedClips] = useState([]); // IDs dos clips selecionados
  const [isSnapping, setIsSnapping] = useState(true); // Magnetic timeline
  
  // Resizable Panels state (4 boxes)
  const [mediaPoolWidth, setMediaPoolWidth] = useState(20); // 20% da largura
  const [editPanelWidth, setEditPanelWidth] = useState(20); // 20% da largura (nova!)
  const [previewHeight, setPreviewHeight] = useState(50); // 50% da altura superior
  const [timelineHeight, setTimelineHeight] = useState(300); // 300px altura
  const [isResizing, setIsResizing] = useState(null); // 'mediaPool' | 'editPanel' | 'timeline' | null

  // Resize handlers (4 boxes)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing === 'mediaPool') {
        const container = document.querySelector('[data-top-row]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
          if (newWidth >= 15 && newWidth <= 40) { // Min 15%, Max 40%
            setMediaPoolWidth(newWidth);
          }
        }
      } else if (isResizing === 'editPanel') {
        const container = document.querySelector('[data-top-row]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newWidth = ((rect.right - e.clientX) / rect.width) * 100;
          if (newWidth >= 15 && newWidth <= 40) { // Min 15%, Max 40%
            setEditPanelWidth(newWidth);
          }
        }
      } else if (isResizing === 'timeline') {
        const toolbarRect = document.querySelector('[data-toolbar]')?.getBoundingClientRect();
        if (toolbarRect) {
          const newHeight = e.clientY - toolbarRect.bottom;
          if (newHeight >= 200 && newHeight <= 600) { // Min 200px, Max 600px
            setTimelineHeight(newHeight);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 
        isResizing === 'mediaPool' || isResizing === 'editPanel' ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
      console.error('Error loading projects:', error);
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
      console.error('Error loading LUT library:', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      const newProject = await projectApi.create({
        name: newProjectName,
        format: newProjectFormat,
        client_id: userId,
        colorist_id: null
      });

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

  const handleTakeUpload = async () => {
    if (!newTakeName.trim()) {
      alert('Por favor, insira um nome para o take');
      return;
    }

    try {
      setUploadingTake(true);
      
      // Por enquanto, usar o vídeo que já foi feito upload anteriormente
      // Em produção: fazer upload para Stream e pegar o videoId
      const mockVideoId = '231c415fc71ac9ecd3f45755308aa5c3'; // Vídeo que você já fez upload!
      
      await handleTakeAdd({
        name: newTakeName,
        source_url: mockVideoId, // Salvar apenas o videoId
        duration: 120,
        fps: 24,
        resolution: '1920x1080',
        codec: 'H.264',
        color_space: 'Rec.709',
        gamma: 'sRGB',
        bit_depth: 8
      });

      setNewTakeName('');
      setIsAddTakeOpen(false);
    } catch (error) {
      console.error('Error uploading take:', error);
      alert('Erro ao adicionar take');
    } finally {
      setUploadingTake(false);
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
    <>
    <div className="h-screen w-full bg-gradient-to-b from-gray-950 to-black overflow-hidden flex items-center justify-center p-[5vh]">
      {/* Studio Container (90% da tela) */}
      <div className="w-full h-full flex flex-col bg-black rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
          
          {/* Top Toolbar with Workspace Switcher */}
          <div className="flex-none border-b border-gray-800 bg-gray-950 px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Left: Project Info */}
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-blue-400" />
                <div>
                  <div className="text-sm font-bold text-white">{currentProject.name}</div>
                  <div className="flex items-center gap-1">
                    <Badge className={`${formatBadge.color} text-[10px] px-1 py-0`}>
                      {formatBadge.label}
                    </Badge>
                    <span className="text-[10px] text-gray-500">
                      {takes.length} takes · {markers.length} markers
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsAddTakeOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Take
                </Button>
                
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger className="w-32 h-8 bg-gray-900 border-gray-800 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="colorist">Colorista</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Workspace */}
          {workspaceMode === 'forja' ? (
            // 🔥 FORJA MODE - 4 Boxes Redimensionáveis
            <div className="flex-1 flex flex-col overflow-hidden min-h-0" data-forja-container>
              {/* Top Row: 4 Boxes (Media Pool | SOURCE | PROGRAM | Edit Panel) */}
              <div className="flex-1 flex border-b border-gray-800 min-h-0 overflow-hidden" data-top-row>
                {/* BOX 1: Media Pool (LEFT - 15-40%) */}
                <div className="border-r border-gray-800 bg-gray-950 flex flex-col overflow-hidden relative" style={{ width: `${mediaPoolWidth}%` }}>
                  {/* Resize Handle (vertical) */}
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors z-10"
                    onMouseDown={() => setIsResizing('mediaPool')}
                    title="Arraste para redimensionar largura"
                  />
                  {/* Media Pool Header */}
                  <div className="px-3 py-2 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-300 uppercase">Media Pool</h3>
                    <div className="flex gap-1">
                      {/* Sort */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setMediaPoolSort(mediaPoolSort === 'name' ? 'timecode' : 'name')}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        title={`Sort by ${mediaPoolSort === 'name' ? 'Timecode' : 'Name'}`}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                      
                      {/* List View */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setMediaPoolView('list')}
                        className={`h-6 w-6 p-0 ${mediaPoolView === 'list' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                        title="List View"
                      >
                        <List className="h-3 w-3" />
                      </Button>
                      
                      {/* Grid View */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setMediaPoolView('grid')}
                        className={`h-6 w-6 p-0 ${mediaPoolView === 'grid' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                        title="Thumbnail View"
                      >
                        <Grid3x3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Takes Content */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {(() => {
                      // Sort takes
                      const sortedTakes = [...takes].sort((a, b) => {
                        if (mediaPoolSort === 'name') {
                          return a.name.localeCompare(b.name);
                        } else {
                          return (a.created_at || '').localeCompare(b.created_at || '');
                        }
                      });

                      // Grid View
                      if (mediaPoolView === 'grid') {
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            {sortedTakes.map((take) => (
                              <button
                                key={take.id}
                                onClick={() => setSelectedTake(take)}
                                className={`relative aspect-video rounded overflow-hidden transition-all ${
                                  selectedTake?.id === take.id
                                    ? 'ring-2 ring-blue-500'
                                    : 'hover:ring-1 hover:ring-gray-600'
                                }`}
                              >
                                {/* Thumbnail placeholder */}
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <Film className="h-8 w-8 text-gray-600" />
                                </div>
                                
                                {/* Take Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                  <div className="text-[10px] font-medium text-white truncate">
                                    {take.name}
                                  </div>
                                  <div className="text-[9px] text-gray-400">
                                    {take.duration}s · {take.fps}fps
                                  </div>
                                </div>
                                
                                {/* Selection indicator */}
                                {selectedTake?.id === take.id && (
                                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      }

                      // List View (compacto - sem retângulos grandes)
                      return (
                        <div className="space-y-0.5">
                          {sortedTakes.map((take) => (
                            <button
                              key={take.id}
                              onClick={() => {
                                setSelectedTake(take); // Só carrega no SOURCE, não mexe no PROGRAM
                              }}
                              className={`w-full text-left px-2 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                                selectedTake?.id === take.id
                                  ? 'text-blue-400 bg-blue-950/30'
                                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                              }`}
                            >
                              <Film className="h-3 w-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{take.name}</div>
                              </div>
                              <div className="text-[9px] text-gray-500 flex-shrink-0">
                                {take.duration}s
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* BOX 2: SOURCE (CENTER - auto width) */}
                <div className="flex-1 p-2 bg-gray-950 flex flex-col" style={{ width: `${100 - mediaPoolWidth - editPanelWidth}%` }}>
                  {/* SOURCE Monitor - Take selecionado (independente) */}
                  <div className="flex flex-col bg-black rounded border border-gray-800" style={{ width: `${playersWidth}%` }}>
                    {/* Header */}
                    <div className="text-[10px] text-gray-400 uppercase mb-1 px-1 flex items-center gap-2">
                      <span>📺 Source</span>
                      {selectedTake && (
                        <span className="text-blue-400 font-mono">{selectedTake.name}</span>
                      )}
                    </div>
                    
                    {/* Video */}
                    <div className="flex-1 bg-black rounded-t border border-gray-800 flex items-center justify-center">
                      {selectedTake ? (
                        <VideoPlayer
                          videoId={selectedTake.source_url}
                          onTimeUpdate={() => {}} // Independente
                          onDurationChange={() => {}}
                          currentTime={0}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="text-2xl mb-2">📹</div>
                          <div className="text-xs">Selecione um take</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Controls SOURCE */}
                    <div className="h-10 bg-gray-900 rounded-b border border-t-0 border-gray-800 flex items-center justify-center gap-2">
                      <button className="p-1.5 hover:bg-gray-800 rounded transition-colors" title="Rewind">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                        </svg>
                      </button>
                      <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors" title="Play/Pause (SOURCE)">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </button>
                      <button className="p-1.5 hover:bg-gray-800 rounded transition-colors" title="Forward">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Resize Handle (vertical - entre SOURCE e PROGRAM) */}
                  <div
                    className="w-1 bg-gray-800 hover:bg-blue-500 cursor-ew-resize transition-colors relative flex-shrink-0"
                    onMouseDown={() => setIsResizing('players')}
                    title="Arraste para redimensionar"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-0.5 bg-gray-600 rounded-full" />
                    </div>
                  </div>

                  {/* PROGRAM/EDIT Monitor - Timeline (sincronizado com batuta) */}
                  <div className="flex flex-col" style={{ width: `${100 - playersWidth}%` }}>
                    {/* Header */}
                    <div className="text-[10px] text-gray-400 uppercase mb-1 px-1 flex items-center gap-2">
                      <span>🎬 Program (Timeline)</span>
                      <span className="text-yellow-500 font-mono">{Math.floor(currentVideoTime)}s</span>
                    </div>
                    
                    {/* Video */}
                    <div className="flex-1 bg-black rounded-t border border-gray-800 flex items-center justify-center">
                      {takes.length > 0 ? (
                        <VideoPlayer
                          videoId={selectedTake?.source_url || takes[0]?.source_url}
                          onTimeUpdate={setCurrentVideoTime}
                          onDurationChange={setVideoDuration}
                          currentTime={currentVideoTime}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="text-2xl mb-2">🎭</div>
                          <div className="text-xs">Timeline vazia</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Controls TIMELINE/PROGRAM */}
                    <div className="h-10 bg-gray-900 rounded-b border border-t-0 border-gray-800 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setCurrentVideoTime(Math.max(0, currentVideoTime - 1))}
                        className="p-1.5 hover:bg-gray-800 rounded transition-colors" 
                        title="Previous Frame (←)"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                        </svg>
                      </button>
                      <button className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors" title="Play Timeline (Space)">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setCurrentVideoTime(currentVideoTime + 1)}
                        className="p-1.5 hover:bg-gray-800 rounded transition-colors" 
                        title="Next Frame (→)"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOX 3: EDIT PANEL (RIGHT - 15-40%) */}
                <div className="border-l border-gray-800 bg-gray-950 flex flex-col overflow-hidden relative" style={{ width: `${editPanelWidth}%` }}>
                  {/* Resize Handle (vertical - esquerda) */}
                  <div
                    className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors z-10"
                    onMouseDown={() => setIsResizing('editPanel')}
                    title="Arraste para redimensionar largura"
                  />
                  
                  {/* Edit Panel Header */}
                  <div className="px-3 py-2 border-b border-gray-800 bg-gray-900 flex items-center">
                    <h3 className="text-xs font-semibold text-gray-300 uppercase">🔧 Edit Controls</h3>
                  </div>
                  
                  {/* Edit Controls Content */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
                    {selectedTake ? (
                      <>
                        {/* Transform */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase">Transform</h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Scale X</label>
                              <input type="number" defaultValue="100" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                              <span className="text-gray-600">%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Scale Y</label>
                              <input type="number" defaultValue="100" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                              <span className="text-gray-600">%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Rotation</label>
                              <input type="number" defaultValue="0" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                              <span className="text-gray-600">°</span>
                            </div>
                          </div>
                        </div>

                        {/* Crop */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase">Crop</h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Top</label>
                              <input type="number" defaultValue="0" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Bottom</label>
                              <input type="number" defaultValue="0" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Left</label>
                              <input type="number" defaultValue="0" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Right</label>
                              <input type="number" defaultValue="0" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Speed */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase">Speed / Duration</h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="w-16 text-gray-500">Speed</label>
                              <input type="number" defaultValue="100" className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-0.5 text-white" />
                              <span className="text-gray-600">%</span>
                            </div>
                            <label className="flex items-center gap-2 text-gray-500">
                              <input type="checkbox" className="rounded" />
                              <span>Reverse</span>
                            </label>
                          </div>
                        </div>

                        {/* Opacity */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase">Opacity</h4>
                          <div className="flex items-center gap-2">
                            <input type="range" min="0" max="100" defaultValue="100" className="flex-1" />
                            <span className="w-8 text-gray-500">100%</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-500 mt-8">
                        <div className="text-2xl mb-2">🎬</div>
                        <div className="text-[10px]">Selecione um take<br/>para editar</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Toolbar Fixa (FIXA 40px) */}
              <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center gap-2 px-3 flex-shrink-0" data-toolbar>
              <div
                className="h-1 bg-gray-800 hover:bg-blue-500 cursor-ns-resize transition-colors relative z-10 flex-shrink-0"
                onMouseDown={() => setIsResizing('preview')}
                title="Arraste para redimensionar"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-0.5 bg-gray-600 rounded-full" />
                </div>
              </div>

              {/* Timeline Row (altura variável) */}
              <div className="bg-black flex flex-col overflow-hidden" style={{ height: `${timelineHeight}px` }}>
                {/* Toolbar dentro da timeline (já existe acima) */}
                <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center gap-2 px-3 flex-shrink-0">
                  {/* Selection Tool */}
                  <button
                    onClick={() => setEditMode('select')}
                    className={`p-2 rounded transition-colors ${
                      editMode === 'select' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    title="Selection Tool (V)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </button>

                  {/* Razor Tool */}
                  <button
                    onClick={() => setEditMode('razor')}
                    className={`p-2 rounded transition-colors ${
                      editMode === 'razor' 
                        ? 'bg-red-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    title="Razor Tool (C)"
                  >
                    ✂️
                  </button>

                  <div className="w-px h-6 bg-gray-700" />

                  {/* Snapping Toggle */}
                  <button
                    onClick={() => setIsSnapping(!isSnapping)}
                    className={`p-2 rounded transition-colors text-xs ${
                      isSnapping 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    title="Snapping (S)"
                  >
                    🧲
                  </button>

                  <div className="flex-1" />

                  {/* Keyboard Shortcuts Hint */}
                  <div className="text-[10px] text-gray-500">
                    <span className="font-mono">V</span> Select · 
                    <span className="font-mono">C</span> Razor · 
                    <span className="font-mono">Space</span> Play · 
                    <span className="font-mono">←→</span> Frame
                  </div>
                </div>

                <VisualTimeline
                  takes={takes}
                  markers={markers}
                  selectedTakeId={selectedTake?.id}
                  currentTime={currentVideoTime}
                  onTakeSelect={setSelectedTake}
                  onTakeReorder={handleTakesReorder}
                  onMarkerClick={(marker) => console.log('Marker clicked:', marker)}
                  onSeek={setCurrentVideoTime}
                  className="h-full"
                />
              </div>

              {/* Resize Handle (timeline height) */}
              <div
                className="h-1 bg-gray-800 hover:bg-blue-500 cursor-ns-resize transition-colors relative flex-shrink-0"
                onMouseDown={() => setIsResizing('timeline')}
                title="Arraste para ajustar altura da timeline"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-0.5 bg-gray-600 rounded-full" />
                </div>
              </div>

              {/* Zoom Bar (FIXA 32px) */}
              <div className="h-8 bg-gray-900 border-t border-gray-800 flex items-center px-4 flex-shrink-0">
                <span className="text-[10px] text-gray-500 mr-2">Zoom:</span>
                <input 
                  type="range" 
                  min="50" 
                  max="200" 
                  defaultValue="100"
                  className="flex-1 h-1"
                />
                <span className="text-[10px] text-gray-400 ml-2 font-mono w-12 text-right">100%</span>
              </div>

              {/* Workspace Selector (FIXA 64px) */}
              <div className="h-16 bg-gray-950 border-t border-gray-800 flex items-center justify-center gap-8 flex-shrink-0">
                <button
                  onClick={() => setWorkspaceMode('forja')}
                  className="flex flex-col items-center gap-0.5 transition-all"
                >
                  <Flame className={`transition-all duration-300 ${
                    workspaceMode === 'forja' 
                      ? 'h-7 w-7 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.9)] filter drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]' 
                      : 'h-5 w-5 text-white opacity-50 hover:opacity-70'
                  }`} />
                  <span className={`text-[8px] font-medium uppercase transition-all ${
                    workspaceMode === 'forja' ? 'text-[#FFD700]' : 'text-white opacity-50'
                  }`}>Edit</span>
                </button>
                
                <button
                  onClick={() => setWorkspaceMode('atelie')}
                  disabled={!selectedTake}
                  className="flex flex-col items-center gap-0.5 transition-all"
                >
                  <Palette className={`transition-all duration-300 ${
                    workspaceMode === 'atelie' 
                      ? 'h-7 w-7 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.9)] filter drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]' 
                      : !selectedTake
                      ? 'h-5 w-5 text-white opacity-30 cursor-not-allowed'
                      : 'h-5 w-5 text-white opacity-50 hover:opacity-70'
                  }`} />
                  <span className={`text-[8px] font-medium uppercase transition-all ${
                    workspaceMode === 'atelie' 
                      ? 'text-[#FFD700]' 
                      : !selectedTake 
                      ? 'text-white opacity-30'
                      : 'text-white opacity-50'
                  }`}>Color</span>
                </button>
                
                <button
                  onClick={() => setWorkspaceMode('revisao')}
                  className="flex flex-col items-center gap-0.5 transition-all"
                >
                  <MessageSquare className={`transition-all duration-300 ${
                    workspaceMode === 'revisao' 
                      ? 'h-7 w-7 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.9)] filter drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]' 
                      : 'h-5 w-5 text-white opacity-50 hover:opacity-70'
                  }`} />
                  <span className={`text-[8px] font-medium uppercase transition-all ${
                    workspaceMode === 'revisao' ? 'text-[#FFD700]' : 'text-white opacity-50'
                  }`}>Review</span>
                </button>
              </div>
            </div>
          ) : workspaceMode === 'atelie' ? (
            // 🎨 ATELIÊ MODE (Color Grading)
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Video Player - 45% (menor para ver os controles) */}
              <div className="flex-[0_0_45%] p-2 bg-gray-950 border-b border-gray-800">
                <VideoPlayer
                  videoId={selectedTake?.source_url}
                  onTimeUpdate={setCurrentVideoTime}
                  onDurationChange={setVideoDuration}
                  currentTime={currentVideoTime}
                  className="w-full h-full"
                />
              </div>

              {/* Timeline + Color Controls - 55% (MAIOR para ver controles) */}
              <div className="flex-[0_0_55%] bg-black">
                <div className="grid grid-cols-2 gap-3 p-3 h-full">
                  {/* Left: Timeline + Markers */}
                  <div className="flex flex-col">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Timeline</h3>
                    <div className="flex-1 bg-gray-900 rounded p-2 overflow-auto">
                      <AdvancedMarkerSystem
                        takeId={selectedTake?.id}
                        takeName={selectedTake?.name}
                        currentTime={currentVideoTime}
                        fps={selectedTake?.fps || 24}
                        markers={markers.filter(m => m.take_id === selectedTake?.id)}
                        userRole={userRole}
                        userId={userId}
                        onMarkerAdd={handleMarkerAdd}
                        onMarkerUpdate={handleMarkerUpdate}
                        onMarkerDelete={handleMarkerDelete}
                        onMarkerReply={handleMarkerReply}
                      />
                    </div>
                  </div>

                  {/* Right: Color Controls */}
                  <div className="flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-900 mb-2">
                        <TabsTrigger value="color" className="text-xs">Primary Color</TabsTrigger>
                        <TabsTrigger value="luts" className="text-xs">LUTs</TabsTrigger>
                      </TabsList>

                      <TabsContent value="color" className="flex-1 overflow-auto">
                        {selectedTake && (
                          <PrimaryColorCorrection
                            takeId={selectedTake.id}
                            takeName={selectedTake.name}
                            version={userRole}
                            initialValues={userRole === 'client' ? clientCorrections : coloristCorrections}
                            onSave={(values) => handleColorCorrectionSave(selectedTake.id, userRole, values)}
                          />
                        )}
                      </TabsContent>

                      <TabsContent value="luts" className="flex-1 overflow-auto">
                        {selectedTake && (
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
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>
          ) : workspaceMode === 'revisao' ? (
            // 💬 REVISÃO MODE (Frame.io Killer - Review & Approval)
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Color Mode Selector */}
              <div className="flex-none px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Visualizar:</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={reviewColorMode === 'none' ? 'default' : 'ghost'}
                      onClick={() => setReviewColorMode('none')}
                      className={reviewColorMode === 'none' ? 'bg-gray-700' : ''}
                    >
                      ❌ Sem Cor
                    </Button>
                    <Button
                      size="sm"
                      variant={reviewColorMode === 'client' ? 'default' : 'ghost'}
                      onClick={() => setReviewColorMode('client')}
                      className={reviewColorMode === 'client' ? 'bg-blue-600' : ''}
                    >
                      👤 Cliente
                    </Button>
                    <Button
                      size="sm"
                      variant={reviewColorMode === 'colorist' ? 'default' : 'ghost'}
                      onClick={() => setReviewColorMode('colorist')}
                      className={reviewColorMode === 'colorist' ? 'bg-purple-600' : ''}
                    >
                      🎨 Colorista
                    </Button>
                  </div>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {takes.length} takes · {markers.filter(m => m.status === 'open').length} pendentes
                </Badge>
              </div>

              {/* Video Player - 40% */}
              <div className="flex-[0_0_40%] p-2 bg-gray-950 border-b border-gray-800">
                <VideoPlayer
                  videoId={selectedTake?.source_url}
                  onTimeUpdate={setCurrentVideoTime}
                  onDurationChange={setVideoDuration}
                  currentTime={currentVideoTime}
                  className="w-full h-full"
                />
              </div>

              {/* Timeline + Comments - 60% */}
              <div className="flex-[0_0_60%] bg-black grid grid-cols-[1fr_300px] gap-3 p-3">
                {/* Left: Timeline com todos os takes */}
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Timeline - Todos os Takes
                  </h3>
                  <div className="flex-1 bg-gray-900 rounded p-3 overflow-auto">
                    <div className="space-y-2">
                      {takes.map((take, index) => (
                        <div key={take.id} className="bg-gray-800 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
                              <span className="text-sm text-white font-medium">{take.name}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedTake(take)}
                              className={selectedTake?.id === take.id ? 'bg-blue-600' : ''}
                            >
                              Ver
                            </Button>
                          </div>
                          <div className="h-8 bg-blue-600 rounded relative">
                            {/* Markers do take */}
                            {markers.filter(m => m.take_id === take.id).map((marker) => (
                              <div
                                key={marker.id}
                                className="absolute top-0 bottom-0 w-1 bg-red-500"
                                style={{ left: `${(marker.timecode / take.duration) * 100}%` }}
                                title={marker.text}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {take.duration}s · {markers.filter(m => m.take_id === take.id).length} markers
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Comments/Markers */}
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Comentários & Markers
                  </h3>
                  <div className="flex-1 bg-gray-900 rounded p-2 overflow-auto space-y-2">
                    {selectedTake && markers.filter(m => m.take_id === selectedTake.id).map((marker) => (
                      <div key={marker.id} className="bg-gray-800 rounded p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-gray-400">{marker.type}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              marker.status === 'resolved' ? 'bg-green-900 text-green-300' :
                              marker.status === 'in_progress' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-red-900 text-red-300'
                            }`}
                          >
                            {marker.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-white mb-1">{marker.text}</p>
                        <div className="text-[10px] text-gray-500">
                          {marker.timecode}s · {marker.user_name || 'User'}
                        </div>
                      </div>
                    ))}
                    {(!selectedTake || markers.filter(m => m.take_id === selectedTake.id).length === 0) && (
                      <div className="text-center text-xs text-gray-500 py-8">
                        Selecione um take para ver comentários
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      </div>

      {/* Dialog para adicionar Take */}
      <Dialog open={isAddTakeOpen} onOpenChange={setIsAddTakeOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Adicionar Take</DialogTitle>
            <DialogDescription className="text-gray-400">
              Adicione um novo take ao projeto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Take</Label>
              <Input
                value={newTakeName}
                onChange={(e) => setNewTakeName(e.target.value)}
                placeholder="Take 1 - Cena Principal"
                className="bg-gray-950 border-gray-800 text-white"
              />
            </div>
            <p className="text-xs text-gray-500">
              💡 O take usará o vídeo que você fez upload anteriormente (UID: 231c415fc71ac9e...). 
              Upload customizado em breve!
            </p>
            <Button
              onClick={handleTakeUpload}
              disabled={!newTakeName.trim() || uploadingTake}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {uploadingTake ? 'Adicionando...' : 'Adicionar Take'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaestroColorStudio;
