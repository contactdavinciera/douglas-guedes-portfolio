import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Clock, 
  DollarSign, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Palette,
  Search,
  Filter,
  Eye
} from 'lucide-react';

const ColoristDashboard = ({ coloristEmail = 'colorist@example.com' }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/colorist/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimProject = async (projectId) => {
    try {
      const response = await fetch(`/api/colorist/project/${projectId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorist_email: coloristEmail })
      });
      
      if (response.ok) {
        fetchDashboardData();
        alert('Projeto reivindicado com sucesso!');
      }
    } catch (error) {
      console.error('Error claiming project:', error);
    }
  };

  const updateProjectStatus = async (projectId, newStatus, notes = '') => {
    try {
      const response = await fetch(`/api/colorist/project/${projectId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes })
      });
      
      if (response.ok) {
        fetchDashboardData();
        alert('Status atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const uploadResult = async (projectId, resultUrl, notes) => {
    try {
      const response = await fetch(`/api/colorist/project/${projectId}/upload-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_url: resultUrl, notes })
      });
      
      if (response.ok) {
        fetchDashboardData();
        alert('Resultado enviado com sucesso!');
      }
    } catch (error) {
      console.error('Error uploading result:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'analyzed': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'grading': 'bg-purple-100 text-purple-800',
      'review': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'delivered': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const pendingProjects = dashboardData?.pending_projects || [];
  const inProgressProjects = dashboardData?.in_progress_projects || [];
  const completedProjects = dashboardData?.completed_projects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Colorist Dashboard</h1>
        <p className="text-gray-600">Bem-vindo, {coloristEmail}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.total_pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{stats.total_in_progress || 0}</p>
              </div>
              <Palette className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed (30d)</p>
                <p className="text-2xl font-bold">{stats.total_completed_month || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue (30d)</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthly_revenue || 0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingProjects.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Projects */}
        <TabsContent value="pending" className="space-y-4">
          {pendingProjects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum projeto pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendingProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        Cliente: {project.client_email}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Format</p>
                      <p className="font-medium">{project.file_format}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Resolution</p>
                      <p className="font-medium">{project.resolution}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{Math.round(project.duration)}s</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">{formatCurrency(project.estimated_price)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => claimProject(project.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Claim Project
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* In Progress Projects */}
        <TabsContent value="in_progress" className="space-y-4">
          {inProgressProjects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum projeto em andamento</p>
              </CardContent>
            </Card>
          ) : (
            inProgressProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        Cliente: {project.client_email}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Format</p>
                      <p className="font-medium">{project.file_format}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Color Space</p>
                      <p className="font-medium">{project.color_space}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Started</p>
                      <p className="font-medium">{formatDate(project.updated_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">{formatCurrency(project.estimated_price)}</p>
                    </div>
                  </div>

                  {project.notes && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Client Notes:</strong> {project.notes}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => updateProjectStatus(project.id, 'grading')}
                    >
                      Mark as Grading
                    </Button>
                    <Button 
                      onClick={() => updateProjectStatus(project.id, 'completed')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Result
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download RAW
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Completed Projects */}
        <TabsContent value="completed" className="space-y-4">
          {completedProjects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum projeto completado nos últimos 30 dias</p>
              </CardContent>
            </Card>
          ) : (
            completedProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        Cliente: {project.client_email}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Completed</p>
                      <p className="font-medium">{formatDate(project.completed_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{Math.round(project.duration)}s</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Resolution</p>
                      <p className="font-medium">{project.resolution}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(project.final_price || project.estimated_price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Result
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ColoristDashboard;
