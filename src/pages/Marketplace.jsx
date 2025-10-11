import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  Award,
  Briefcase,
  Film,
  Search,
  Filter,
  TrendingUp,
  CheckCircle,
  Play,
  Eye,
  Heart,
  MessageCircle
} from 'lucide-react';

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  
  const professionals = [
    {
      id: 1,
      name: 'Douglas Guedes',
      role: 'Master Colorist & Editor',
      avatar: '👨‍🎨',
      rating: 5.0,
      reviews: 234,
      projects: 456,
      hourlyRate: 200,
      availability: 'available',
      location: 'São Paulo, BR',
      specialties: ['Dolby Vision', 'HDR', 'Commercial', 'Music Videos'],
      experience: '10+ years',
      featured: true,
      portfolio: [
        { thumb: '🎬', title: 'Nike Commercial 2025' },
        { thumb: '🎵', title: 'Anitta - Envolver 2024' },
        { thumb: '📺', title: 'Netflix Series EP03' }
      ],
      bio: 'Award-winning colorist specialized in HDR and Dolby Vision workflows. Worked with major brands and artists.',
      certifications: ['DaVinci Resolve Certified', 'Dolby Vision Professional']
    },
    {
      id: 2,
      name: 'Maria Santos',
      role: 'Senior Video Editor',
      avatar: '👩‍💼',
      rating: 4.9,
      reviews: 189,
      projects: 312,
      hourlyRate: 150,
      availability: 'available',
      location: 'Rio de Janeiro, BR',
      specialties: ['Documentary', 'Corporate', 'Social Media'],
      experience: '8 years',
      featured: true,
      portfolio: [
        { thumb: '📽️', title: 'BBC Documentary' },
        { thumb: '💼', title: 'Tech Corp Video' }
      ],
      bio: 'Passionate about storytelling through editing. Specialized in documentary and corporate content.',
      certifications: ['Premiere Pro Certified']
    },
    {
      id: 3,
      name: 'Carlos Mendes',
      role: 'Color Grading Specialist',
      avatar: '🧑‍🎨',
      rating: 4.8,
      reviews: 156,
      projects: 278,
      hourlyRate: 180,
      availability: 'busy',
      location: 'Lisbon, PT',
      specialties: ['Cinema', 'HDR', 'Film Look'],
      experience: '12 years',
      featured: false,
      portfolio: [
        { thumb: '🎥', title: 'Feature Film 2024' }
      ],
      bio: 'Cinema colorist with deep knowledge of film emulation and HDR workflows.',
      certifications: ['Baselight Certified', 'HDR Master Class']
    },
    {
      id: 4,
      name: 'Ana Silva',
      role: 'Motion Graphics & Editing',
      avatar: '👩‍🎨',
      rating: 4.9,
      reviews: 201,
      projects: 389,
      hourlyRate: 120,
      availability: 'available',
      location: 'Porto, PT',
      specialties: ['Motion Design', 'After Effects', 'Social Media'],
      experience: '6 years',
      featured: false,
      portfolio: [
        { thumb: '✨', title: 'Motion Graphics Reel' }
      ],
      bio: 'Creative motion designer and editor focused on social media content.',
      certifications: ['After Effects Certified']
    },
    {
      id: 5,
      name: 'Pedro Costa',
      role: 'Documentary Editor',
      avatar: '👨‍💻',
      rating: 4.7,
      reviews: 143,
      projects: 234,
      hourlyRate: 140,
      availability: 'available',
      location: 'Brasília, BR',
      specialties: ['Documentary', 'Long Form', 'Interviews'],
      experience: '9 years',
      featured: false,
      portfolio: [
        { thumb: '📹', title: 'Award Winning Doc' }
      ],
      bio: 'Documentary specialist with focus on long-form storytelling.',
      certifications: ['Final Cut Pro Certified']
    },
    {
      id: 6,
      name: 'Julia Rodrigues',
      role: 'Commercial Colorist',
      avatar: '👩‍🔧',
      rating: 5.0,
      reviews: 178,
      projects: 298,
      hourlyRate: 220,
      availability: 'busy',
      location: 'São Paulo, BR',
      specialties: ['Advertising', 'Fashion', 'Beauty'],
      experience: '11 years',
      featured: true,
      portfolio: [
        { thumb: '💄', title: 'L\'Oréal Campaign' }
      ],
      bio: 'High-end commercial colorist working with top beauty and fashion brands.',
      certifications: ['Dolby Vision Professional', 'ACES Workflow']
    }
  ];

  const filteredProfessionals = professionals
    .filter(pro => {
      const matchesSearch = pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           pro.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || pro.specialties.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_low') return a.hourlyRate - b.hourlyRate;
      if (sortBy === 'price_high') return b.hourlyRate - a.hourlyRate;
      if (sortBy === 'reviews') return b.reviews - a.reviews;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 pt-20">
      
      {/* 3D Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-4">
            Professional Marketplace
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Hire world-class colorists and editors for your projects
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{professionals.length}+</div>
              <div className="text-sm text-gray-400">Professionals</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">2.4k+</div>
              <div className="text-sm text-gray-400">Projects Done</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.9</div>
              <div className="text-sm text-gray-400">Avg Rating</div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, specialty, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-black/30 border-white/10 text-white placeholder:text-gray-500 h-12"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] bg-black/30 border-white/10 text-white h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Dolby Vision">Dolby Vision</SelectItem>
                <SelectItem value="HDR">HDR</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Documentary">Documentary</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Cinema">Cinema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-black/30 border-white/10 text-white h-12">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Professionals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProfessionals.map((pro, index) => (
            <motion.div
              key={pro.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className={`glass-card p-6 hover:scale-[1.02] transition-all ${
                pro.featured ? 'border-2 border-purple-500/50' : ''
              }`}>
                
                {/* Featured Badge */}
                {pro.featured && (
                  <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600">
                    <Award className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}

                <div className="flex gap-4 mb-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 text-5xl flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl border border-white/10">
                      {pro.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-gray-900 ${
                      pro.availability === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{pro.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{pro.role}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-white">{pro.rating}</span>
                        <span className="text-gray-400">({pro.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Briefcase className="w-4 h-4" />
                        <span>{pro.projects} projects</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">${pro.hourlyRate}</div>
                    <div className="text-xs text-gray-400">/hour</div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {pro.bio}
                </p>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {pro.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-3 h-3" />
                    {pro.experience}
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {pro.specialties.map((spec, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                      {spec}
                    </Badge>
                  ))}
                </div>

                {/* Portfolio Thumbnails */}
                <div className="flex gap-2 mb-4">
                  {pro.portfolio.map((item, i) => (
                    <div
                      key={i}
                      className="flex-1 aspect-video bg-black/50 rounded-lg flex items-center justify-center text-3xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden"
                      title={item.title}
                    >
                      <span>{item.thumb}</span>
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 btn-3d"
                    disabled={pro.availability === 'busy'}
                  >
                    {pro.availability === 'available' ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Hire Now
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Busy
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                    <Eye className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                  <Button variant="ghost" className="text-gray-400 hover:text-white">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" className="text-gray-400 hover:text-white">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredProfessionals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Film className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No professionals found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Marketplace;
