import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  MessageSquare,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Edit3,
  Send,
  Reply,
  Check,
  X,
  MoreVertical,
  Trash2,
  Palette,
  Sun,
  Camera,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdvancedMarkerSystem = ({
  takeId,
  takeName,
  currentTime,
  fps = 24,
  markers = [],
  userRole = 'client',
  userId,
  onMarkerAdd,
  onMarkerUpdate,
  onMarkerDelete,
  onMarkerReply,
  disabled = false
}) => {
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [newMarkerText, setNewMarkerText] = useState('');
  const [newMarkerType, setNewMarkerType] = useState('note');
  const [newMarkerCategory, setNewMarkerCategory] = useState('general');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const markerTypes = [
    { value: 'note', label: 'Nota', icon: MessageSquare, color: 'bg-blue-500' },
    { value: 'issue', label: 'Problema', icon: AlertCircle, color: 'bg-red-500' },
    { value: 'approval', label: 'Aprovação', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'question', label: 'Pergunta', icon: HelpCircle, color: 'bg-yellow-500' },
    { value: 'change_request', label: 'Mudança', icon: Edit3, color: 'bg-orange-500' }
  ];

  const markerCategories = [
    { value: 'general', label: 'Geral', icon: FileText },
    { value: 'color', label: 'Cor', icon: Palette },
    { value: 'exposure', label: 'Exposição', icon: Sun },
    { value: 'composition', label: 'Composição', icon: Camera }
  ];

  const markerStatuses = [
    { value: 'open', label: 'Aberto', color: 'bg-blue-600' },
    { value: 'in_progress', label: 'Em Progresso', color: 'bg-yellow-600' },
    { value: 'resolved', label: 'Resolvido', color: 'bg-green-600' },
    { value: 'wont_fix', label: 'Não Resolverá', color: 'bg-gray-600' }
  ];

  const formatTimecode = (seconds) => {
    const totalFrames = Math.floor(seconds * fps);
    const hours = Math.floor(totalFrames / (fps * 3600));
    const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
    const secs = Math.floor((totalFrames % (fps * 60)) / fps);
    const frames = totalFrames % fps;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const getMarkerIcon = (type) => {
    const markerType = markerTypes.find(t => t.value === type);
    return markerType ? markerType.icon : MessageSquare;
  };

  const getMarkerColor = (type) => {
    const markerType = markerTypes.find(t => t.value === type);
    return markerType ? markerType.color : 'bg-blue-500';
  };

  const getCategoryIcon = (category) => {
    const cat = markerCategories.find(c => c.value === category);
    return cat ? cat.icon : FileText;
  };

  const getStatusColor = (status) => {
    const statusObj = markerStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-600';
  };

  const handleAddMarker = async () => {
    if (!newMarkerText.trim()) return;

    const frameNumber = Math.floor(currentTime * fps);

    await onMarkerAdd({
      take_id: takeId,
      timecode: currentTime,
      frame_number: frameNumber,
      type: newMarkerType,
      category: newMarkerCategory,
      author_id: userId,
      author_role: userRole,
      text: newMarkerText,
      status: 'open'
    });

    setNewMarkerText('');
    setNewMarkerType('note');
    setNewMarkerCategory('general');
    setIsAddingMarker(false);
  };

  const handleReply = async (markerId) => {
    if (!replyText.trim()) return;

    const frameNumber = Math.floor(currentTime * fps);

    await onMarkerReply({
      take_id: takeId,
      timecode: currentTime,
      frame_number: frameNumber,
      type: 'note',
      category: 'general',
      author_id: userId,
      author_role: userRole,
      text: replyText,
      parent_marker_id: markerId,
      status: 'open'
    });

    setReplyText('');
    setReplyingTo(null);
  };

  const handleStatusChange = async (markerId, newStatus) => {
    await onMarkerUpdate(markerId, { status: newStatus });
  };

  const getFilteredMarkers = () => {
    return markers
      .filter(m => !m.parent_marker_id)
      .filter(m => filterType === 'all' || m.type === filterType)
      .filter(m => filterStatus === 'all' || m.status === filterStatus)
      .sort((a, b) => b.created_at - a.created_at);
  };

  const getReplies = (markerId) => {
    return markers
      .filter(m => m.parent_marker_id === markerId)
      .sort((a, b) => a.created_at - b.created_at);
  };

  const filteredMarkers = getFilteredMarkers();

  const MarkerCard = ({ marker }) => {
    const Icon = getMarkerIcon(marker.type);
    const CategoryIcon = getCategoryIcon(marker.category);
    const replies = getReplies(marker.id);
    const isAuthor = marker.author_id === userId;

    return (
      <div className="bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`${getMarkerColor(marker.type)} p-2 rounded-lg flex-shrink-0`}>
              <Icon className="h-4 w-4 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${getStatusColor(marker.status)} text-xs`}>
                    {markerStatuses.find(s => s.value === marker.status)?.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-gray-700">
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {markerCategories.find(c => c.value === marker.category)?.label}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatTimecode(marker.timecode)}
                  </span>
                </div>

                {(isAuthor || userRole === 'colorist') && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => onMarkerDelete(marker.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="text-sm text-white mb-2">
                {marker.text}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Por <span className={marker.author_role === 'colorist' ? 'text-purple-400' : 'text-blue-400'}>
                    {marker.author_role === 'colorist' ? 'Colorista' : 'Cliente'}
                  </span>
                  {' • '}
                  {new Date(marker.created_at).toLocaleString('pt-BR')}
                </div>

                <div className="flex gap-2">
                  {userRole === 'colorist' && marker.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs text-green-400 hover:text-green-300"
                      onClick={() => handleStatusChange(marker.id, 'resolved')}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Resolver
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setReplyingTo(replyingTo === marker.id ? null : marker.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Responder ({replies.length})
                  </Button>

                  {marker.status === 'open' && (
                    <Select
                      value={marker.status}
                      onValueChange={(value) => handleStatusChange(marker.id, value)}
                    >
                      <SelectTrigger className="h-6 text-xs w-32 bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {markerStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-gray-800 space-y-2">
                  {replies.map(reply => (
                    <div key={reply.id} className="bg-gray-900 rounded p-3">
                      <div className="text-sm text-white mb-1">
                        {reply.text}
                      </div>
                      <div className="text-xs text-gray-500">
                        Por <span className={reply.author_role === 'colorist' ? 'text-purple-400' : 'text-blue-400'}>
                          {reply.author_role === 'colorist' ? 'Colorista' : 'Cliente'}
                        </span>
                        {' • '}
                        {new Date(reply.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === marker.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="bg-gray-900 border-gray-800 text-white text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReply(marker.id)}
                      disabled={!replyText.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Enviar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-yellow-400" />
            <div>
              <div className="text-white">Markers e Comentários</div>
              <div className="text-xs font-normal text-gray-400 mt-1">
                {takeName}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddingMarker(!isAddingMarker)}
            disabled={disabled}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Novo Marker
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAddingMarker && (
          <div className="bg-black/40 rounded-lg p-4 border border-gray-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Tipo</Label>
                <Select value={newMarkerType} onValueChange={setNewMarkerType}>
                  <SelectTrigger className="bg-gray-950 border-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {markerTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Categoria</Label>
                <Select value={newMarkerCategory} onValueChange={setNewMarkerCategory}>
                  <SelectTrigger className="bg-gray-950 border-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {markerCategories.map(category => {
                      const Icon = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">
                Timecode: <span className="text-white font-mono">{formatTimecode(currentTime)}</span>
              </Label>
              <Textarea
                placeholder="Digite seu comentário..."
                value={newMarkerText}
                onChange={(e) => setNewMarkerText(e.target.value)}
                className="bg-gray-950 border-gray-800 text-white"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddMarker}
                disabled={!newMarkerText.trim()}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Adicionar Marker
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddingMarker(false);
                  setNewMarkerText('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-gray-950 border-gray-800 text-white text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {markerTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-gray-950 border-gray-800 text-white text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {markerStatuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="ml-auto bg-gray-800 text-gray-300">
            {filteredMarkers.length} markers
          </Badge>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredMarkers.length > 0 ? (
            filteredMarkers.map(marker => (
              <MarkerCard key={marker.id} marker={marker} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum marker neste take</p>
              <p className="text-sm mt-1">
                Clique em "Novo Marker" ou pressione Shift+Click na timeline
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedMarkerSystem;
