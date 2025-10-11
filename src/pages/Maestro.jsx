import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Film,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  Calendar,
  Eye,
  Zap,
  Award,
  Target
} from 'lucide-react';

const Maestro = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [timeRange, setTimeRange] = useState('week');

  // Mock data - substituir por API real
  const stats = {
    activeProjects: 12,
    pendingApprovals: 5,
    renderingQueue: 3,
    completedThisWeek: 8,
    totalRevenue: 45800,
    avgProjectTime: 3.5,
    clientSatisfaction: 98,
    deliveredOnTime: 95
  };

  const projects = [
    {
      id: 1,
      name: 'Comercial Nike - Verão 2025',
      client: 'Nike Brasil',
      colorist: 'Douglas Guedes',
      status: 'in_progress',
      progress: 65,
      deadline: '2025-10-15',
      format: 'DOLBY_VISION_P3',
      takes: 15,
      budget: 12000,
      spent: 7800,
      priority: 'high',
      lastUpdate: '2025-10-11 14:30'
    },
    {
      id: 2,
      name: 'Série Netflix - EP03',
      client: 'Netflix',
      colorist: 'Ana Silva',
      status: 'rendering',
      progress: 85,
      deadline: '2025-10-12',
      format: 'HDR_REC2020',
      takes: 42,
      budget: 25000,
      spent: 22000,
      priority: 'urgent',
      lastUpdate: '2025-10-11 15:45'
    },
    {
      id: 3,
      name: 'Clipe Musical - Anitta',
      client: 'Warner Music',
      colorist: 'Douglas Guedes',
      status: 'pending_approval',
      progress: 100,
      deadline: '2025-10-13',
      format: 'SDR',
      takes: 8,
      budget: 8000,
      spent: 8000,
      priority: 'medium',
      lastUpdate: '2025-10-11 12:15'
    },
    {
      id: 4,
      name: 'Documentário BBC',
      client: 'BBC Studios',
      colorist: 'Carlos Mendes',
      status: 'completed',
      progress: 100,
      deadline: '2025-10-10',
      format: 'HDR_REC2020',
      takes: 28,
      budget: 18000,
      spent: 17500,
      priority: 'medium',
      lastUpdate: '2025-10-10 18:00'
    },
    {
      id: 5,
      name: 'Comercial Coca-Cola',
      client: 'Coca-Cola Company',
      colorist: 'Ana Silva',
      status: 'in_progress',
      progress: 40,
      deadline: '2025-10-20',
      format: 'DOLBY_VISION_P3',
      takes: 12,
      budget: 15000,
      spent: 6000,
      priority: 'high',
      lastUpdate: '2025-10-11 16:20'
    }
  ];

  const colorists = [
    {
      id: 1,
      name: 'Douglas Guedes',
      avatar: '👨‍🎨',
      activeProjects: 5,
      completedThisMonth: 12,
      hoursThisWeek: 42,
      specialties: ['Dolby Vision', 'HDR', 'Comerciais'],
      efficiency: 98,
      status: 'online'
    },
    {
      id: 2,
      name: 'Ana Silva',
      avatar: '👩‍🎨',
      activeProjects: 4,
      completedThisMonth: 10,
      hoursThisWeek: 38,
      specialties: ['Séries', 'Cinema', 'HDR'],
      efficiency: 95,
      status: 'online'
    },
    {
      id: 3,
      name: 'Carlos Mendes',
      avatar: '🧑‍🎨',
      activeProjects: 3,
      completedThisMonth: 8,
      hoursThisWeek: 35,
      specialties: ['Documentários', 'Corporativo'],
      efficiency: 92,
      status: 'away'
    }
  ];

  const getStatusInfo = (status) => {
    const statusMap = {
      'in_progress': { label: 'Em Progresso', color: 'bg-blue-500', icon: Play },
      'rendering': { label: 'Renderizando', color: 'bg-purple-500', icon: Zap },
      'pending_approval': { label: 'Aguardando Aprovação', color: 'bg-yellow-500', icon: Clock },
      'completed': { label: 'Concluído', color: 'bg-green-500', icon: CheckCircle },
      'on_hold': { label: 'Em Espera', color: 'bg-gray-500', icon: Pause }
    };
    return statusMap[status] || statusMap['in_progress'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'bg-red-500',
      'high': 'bg-orange-500',
      'medium': 'bg-yellow-500',
      'low': 'bg-green-500'
    };
    return colors[priority] || colors['medium'];
  };

  const getFormatBadge = (format) => {
    const badges = {
      'SDR': { label: 'SDR', color: 'bg-gray-600' },
      'HDR_REC2020': { label: 'HDR', color: 'bg-purple-600' },
      'DOLBY_VISION_P3': { label: 'Dolby Vision', color: 'bg-yellow-600' }
    };
    return badges[format] || badges['SDR'];
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesClient = filterClient === 'all' || project.client === filterClient;
    return matchesSearch && matchesStatus && matchesClient;
  });

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-950 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Maestro
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Central de Comando • Color Grading Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Upload className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Film className="h-5 w-5 text-blue-400" />
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.activeProjects}</div>
                <div className="text-xs text-gray-400">Projetos Ativos</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.pendingApprovals}</div>
                <div className="text-xs text-gray-400">Aguardando</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.renderingQueue}</div>
                <div className="text-xs text-gray-400">Renderizando</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.completedThisWeek}</div>
                <div className="text-xs text-gray-400">Concluídos</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {(stats.totalRevenue / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-gray-400">Receita (mês)</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.avgProjectTime}d</div>
                <div className="text-xs text-gray-400">Tempo Médio</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.clientSatisfaction}%</div>
                <div className="text-xs text-gray-400">Satisfação</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.deliveredOnTime}%</div>
                <div className="text-xs text-gray-400">No Prazo</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 border border-gray-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-blue-600">
              <Film className="h-4 w-4 mr-2" />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-blue-600">
              <Users className="h-4 w-4 mr-2" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Projects Overview */}
              <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Projetos Prioritários</CardTitle>
                  <CardDescription>Projetos que precisam de atenção imediata</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredProjects.filter(p => p.priority === 'urgent' || p.priority === 'high').slice(0, 4).map(project => {
                    const statusInfo = getStatusInfo(project.status);
                    const formatBadge = getFormatBadge(project.format);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div key={project.id} className="p-4 bg-gray-950 rounded-lg border border-gray-800 hover:border-gray-700 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white">{project.name}</h3>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>{project.client}</span>
                              <span>•</span>
                              <span>{project.colorist}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusInfo.color} text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge className={`${formatBadge.color} text-xs`}>
                              {formatBadge.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Progresso</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-xs">
                          <span className="text-gray-400">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Projeto
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Team Activity */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Equipe Ativa</CardTitle>
                  <CardDescription>Status e performance dos coloristas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {colorists.map(colorist => (
                    <div key={colorist.id} className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">{colorist.avatar}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white text-sm">{colorist.name}</h4>
                            <div className={`w-2 h-2 rounded-full ${
                              colorist.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                          </div>
                          <div className="text-xs text-gray-400">{colorist.activeProjects} projetos ativos</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>Eficiência</span>
                        <span className="text-green-400 font-semibold">{colorist.efficiency}%</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {colorist.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-gray-700 text-gray-400">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            {/* Filters */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar projetos ou clientes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-950 border-gray-800 text-white"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] bg-gray-950 border-gray-800 text-white">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="rendering">Renderizando</SelectItem>
                      <SelectItem value="pending_approval">Aguardando</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[150px] bg-gray-950 border-gray-800 text-white">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Esta Semana</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Projects List */}
            <div className="grid gap-4">
              {filteredProjects.map(project => {
                const statusInfo = getStatusInfo(project.status);
                const formatBadge = getFormatBadge(project.format);
                const StatusIcon = statusInfo.icon;
                const budgetUsed = (project.spent / project.budget) * 100;

                return (
                  <Card key={project.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{project.name}</h3>
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)}`} />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {project.client}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Film className="h-4 w-4" />
                              {project.colorist}
                            </span>
                            <span>•</span>
                            <span>{project.takes} takes</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={`${statusInfo.color} px-3 py-1`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <Badge className={`${formatBadge.color} px-3 py-1`}>
                            {formatBadge.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Progresso do Projeto</span>
                            <span className="font-semibold text-white">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Budget Utilizado</span>
                            <span className={`font-semibold ${budgetUsed > 90 ? 'text-red-400' : 'text-green-400'}`}>
                              {budgetUsed.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${budgetUsed > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${budgetUsed}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Prazo de Entrega</div>
                            <div className="text-white font-semibold">
                              {new Date(project.deadline).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <Calendar className="h-8 w-8 text-gray-600" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <div className="text-xs text-gray-500">
                          Última atualização: {project.lastUpdate}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Abrir Projeto
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {colorists.map(colorist => (
                <Card key={colorist.id} className="bg-gray-900 border-gray-800 hover:border-blue-600 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{colorist.avatar}</div>
                      <div className="flex-1">
                        <CardTitle className="text-white flex items-center gap-2">
                          {colorist.name}
                          <div className={`w-2 h-2 rounded-full ${
                            colorist.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        </CardTitle>
                        <CardDescription>
                          {colorist.status === 'online' ? 'Online agora' : 'Ausente'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-gray-950 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">{colorist.activeProjects}</div>
                        <div className="text-xs text-gray-400 mt-1">Ativos</div>
                      </div>
                      <div className="p-3 bg-gray-950 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">{colorist.completedThisMonth}</div>
                        <div className="text-xs text-gray-400 mt-1">Concluídos</div>
                      </div>
                      <div className="p-3 bg-gray-950 rounded-lg">
                        <div className="text-2xl font-bold text-purple-400">{colorist.hoursThisWeek}h</div>
                        <div className="text-xs text-gray-400 mt-1">Esta semana</div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Eficiência</span>
                        <span className="text-sm font-semibold text-green-400">{colorist.efficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${colorist.efficiency}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-2">Especialidades</div>
                      <div className="flex flex-wrap gap-2">
                        {colorist.specialties.map((specialty, idx) => (
                          <Badge key={idx} className="bg-blue-600 text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Ver Perfil Completo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Analytics em Construção</CardTitle>
                <CardDescription>
                  Em breve você terá acesso a gráficos detalhados de performance, receita e muito mais.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-20 text-center">
                <BarChart3 className="h-20 w-20 mx-auto mb-4 text-gray-700" />
                <p className="text-gray-500">
                  Gráficos e relatórios avançados serão implementados aqui
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Maestro;
