import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const projectApi = {
  async create(projectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        format: projectData.format,
        client_id: projectData.client_id,
        colorist_id: projectData.colorist_id,
        status: 'draft'
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getById(projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async update(projectId, updates) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async list(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(`client_id.eq.${userId},colorist_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const takeApi = {
  async create(takeData) {
    const { data, error } = await supabase
      .from('timeline_takes')
      .insert([takeData])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async listByProject(projectId) {
    const { data, error } = await supabase
      .from('timeline_takes')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async update(takeId, updates) {
    const { data, error } = await supabase
      .from('timeline_takes')
      .update(updates)
      .eq('id', takeId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async reorder(takes) {
    const updates = takes.map(take => ({
      id: take.id,
      order_index: take.order_index
    }));

    const { error } = await supabase
      .from('timeline_takes')
      .upsert(updates);

    if (error) throw error;
    return true;
  },

  async delete(takeId) {
    const { error } = await supabase
      .from('timeline_takes')
      .delete()
      .eq('id', takeId);

    if (error) throw error;
    return true;
  }
};

export const colorCorrectionApi = {
  async save(takeId, version, corrections) {
    const { data, error } = await supabase
      .from('color_corrections')
      .upsert([{
        take_id: takeId,
        version: version,
        ...corrections,
        updated_at: new Date().toISOString()
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async get(takeId, version) {
    const { data, error } = await supabase
      .from('color_corrections')
      .select('*')
      .eq('take_id', takeId)
      .eq('version', version)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async listByTake(takeId) {
    const { data, error } = await supabase
      .from('color_corrections')
      .select('*')
      .eq('take_id', takeId);

    if (error) throw error;
    return data;
  }
};

export const lutApi = {
  async save(takeId, version, lutData) {
    const { data, error } = await supabase
      .from('lut_assignments')
      .upsert([{
        take_id: takeId,
        version: version,
        ...lutData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async get(takeId, version) {
    const { data, error } = await supabase
      .from('lut_assignments')
      .select('*')
      .eq('take_id', takeId)
      .eq('version', version)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async listLibrary() {
    const { data, error } = await supabase
      .from('lut_library')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getConversionLUTs(sourceColorSpace, targetColorSpace) {
    const { data, error } = await supabase
      .from('lut_library')
      .select('*')
      .eq('category', 'conversion')
      .eq('source_color_space', sourceColorSpace)
      .eq('target_color_space', targetColorSpace);

    if (error) throw error;
    return data;
  },

  async getCreativeLUTs() {
    const { data, error } = await supabase
      .from('lut_library')
      .select('*')
      .eq('category', 'creative')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }
};

export const markerApi = {
  async create(markerData) {
    const { data, error } = await supabase
      .from('markers')
      .insert([markerData])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async listByTake(takeId) {
    const { data, error } = await supabase
      .from('markers')
      .select('*')
      .eq('take_id', takeId)
      .order('timecode', { ascending: true });

    if (error) throw error;
    return data;
  },

  async listByProject(projectId) {
    const { data, error } = await supabase
      .from('markers')
      .select(`
        *,
        timeline_takes!inner(project_id)
      `)
      .eq('timeline_takes.project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async update(markerId, updates) {
    const { data, error } = await supabase
      .from('markers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', markerId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async delete(markerId) {
    const { error } = await supabase
      .from('markers')
      .delete()
      .eq('id', markerId);

    if (error) throw error;
    return true;
  },

  async reply(parentMarkerId, replyData) {
    const { data, error } = await supabase
      .from('markers')
      .insert([{
        ...replyData,
        parent_marker_id: parentMarkerId
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};

export const realtimeSubscriptions = {
  subscribeToProject(projectId, callbacks) {
    const channel = supabase
      .channel(`project_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_takes',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          callbacks.onTakeChange && callbacks.onTakeChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'markers'
        },
        (payload) => {
          callbacks.onMarkerChange && callbacks.onMarkerChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
