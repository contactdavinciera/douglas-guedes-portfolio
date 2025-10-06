import React, { useState, useRef } from 'react';
import { Play, Pause, MessageCircle, Download, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';

const ClientDashboard = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 minutes example
  const [comments, setComments] = useState([
    {
      id: 1,
      time: 15,
      message: "Gostaria de um tom mais quente nesta cena",
      status: "pending",
      timestamp: "2024-01-15 14:30"
    },
    {
      id: 2,
      time: 45,
      message: "Perfeito! Exatamente como imaginei",
      status: "resolved",
      timestamp: "2024-01-15 15:45"
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [commentTime, setCommentTime] = useState(0);
  const videoRef = useRef(null);

  const project = {
    id: "PRJ-001",
    title: "Campanha Verão 2024",
    status: "in_progress",
    progress: 75,
    deliveryDate: "2024-01-20",
    lutStyle: "Cinematográfico",
    resolution: "4K",
    duration: "2:00"
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        time: currentTime,
        message: newComment,
        status: "pending",
        timestamp: new Date().toLocaleString('pt-BR')
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'pending': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'in_progress': return <Clock size={16} className="text-yellow-400" />;
      case 'pending': return <AlertCircle size={16} className="text-blue-400" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Header */}
      <section className="py-8 bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <p className="text-gray-400">Projeto #{project.id}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`font-semibold ${getStatusColor(project.status)}`}>
                  {project.status === 'completed' && 'Concluído'}
                  {project.status === 'in_progress' && 'Em Andamento'}
                  {project.status === 'pending' && 'Aguardando'}
                </div>
                <div className="text-sm text-gray-400">
                  Entrega: {project.deliveryDate}
                </div>
              </div>
              {getStatusIcon(project.status)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso do Projeto</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Player */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Preview do Projeto</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Look: {project.lutStyle}</span>
                    <span>•</span>
                    <span>{project.resolution}</span>
                    <span>•</span>
                    <span>{project.duration}</span>
                  </div>
                </div>
                
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => setDuration(videoRef.current.duration)}
                  >
                    <source src="/api/placeholder/video" type="video/mp4" />
                  </video>
                  
                  {/* Watermark */}
                  <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 rounded text-sm">
                    PREVIEW - Douglas Guedes
                  </div>
                  
                  {/* Play Button Overlay */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={togglePlay}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-colors"
                      >
                        <Play size={32} className="text-white ml-1" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Video Controls */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlay}
                      className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  {/* Timeline */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={currentTime}
                      onChange={(e) => seekTo(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    
                    {/* Comment Markers */}
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="absolute top-0 w-3 h-3 bg-yellow-400 rounded-full transform -translate-y-1/2 cursor-pointer"
                        style={{ left: `${(comment.time / duration) * 100}%` }}
                        onClick={() => seekTo(comment.time)}
                        title={`Comentário em ${formatTime(comment.time)}: ${comment.message}`}
                      ></div>
                    ))}
                  </div>
                </div>
                
                {/* Download Section */}
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Download Final</h3>
                      <p className="text-sm text-gray-400">
                        Disponível após aprovação final e pagamento
                      </p>
                    </div>
                    <button 
                      className="bg-gray-600 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
                      disabled
                    >
                      <Download size={16} className="inline mr-2" />
                      Bloqueado
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comments Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Comentários e Revisões</h2>
                
                {/* Add Comment */}
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-3">Adicionar Comentário</h3>
                  <div className="text-sm text-gray-400 mb-2">
                    Tempo atual: {formatTime(currentTime)}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Descreva sua solicitação de revisão..."
                    className="w-full bg-black border border-gray-600 rounded-lg px-3 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none"
                    rows="3"
                  />
                  <button
                    onClick={addComment}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Adicionar Comentário
                  </button>
                </div>
                
                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-sm font-semibold">Você</span>
                        </div>
                        <button
                          onClick={() => seekTo(comment.time)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {formatTime(comment.time)}
                        </button>
                      </div>
                      <p className="text-sm mb-3">{comment.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{comment.timestamp}</span>
                        <span className={`px-2 py-1 rounded ${
                          comment.status === 'resolved' 
                            ? 'bg-green-900 text-green-400' 
                            : 'bg-yellow-900 text-yellow-400'
                        }`}>
                          {comment.status === 'resolved' ? 'Resolvido' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Details */}
      <section className="py-8 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">Detalhes do Projeto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black rounded-lg p-6">
              <h3 className="font-semibold mb-4">Especificações</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolução:</span>
                  <span>{project.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duração:</span>
                  <span>{project.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Look:</span>
                  <span>{project.lutStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Formato:</span>
                  <span>ProRes 422 HQ</span>
                </div>
              </div>
            </div>
            
            <div className="bg-black rounded-lg p-6">
              <h3 className="font-semibold mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Projeto iniciado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Primeira versão</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock size={16} className="text-yellow-400" />
                  <span>Revisões em andamento</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertCircle size={16} className="text-gray-400" />
                  <span>Aprovação final</span>
                </div>
              </div>
            </div>
            
            <div className="bg-black rounded-lg p-6">
              <h3 className="font-semibold mb-4">Suporte</h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-400">
                  Precisa de ajuda ou tem dúvidas sobre o projeto?
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                  <MessageCircle size={16} className="inline mr-2" />
                  Contatar Douglas
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClientDashboard;
