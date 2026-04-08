import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Sparkles,
  History,
  Plus,
  Save,
  CheckCircle2,
  Play,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit3,
  Copy,
  MessageSquare,
  Radio,
  PenTool,
  Video,
  Music,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

const PromptHub = ({ channelData, onUpdateActivePrompts }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [activePromptCategory, setActivePromptCategory] = useState('audio');
  const [editForm, setEditForm] = useState({
    name: '',
    audio: '',
    script: '',
    description: '',
    thumbnail: '',
    shorts: ''
  });

  const promptTypes = [
    { key: 'audio', label: 'Audio Generation', icon: <Radio size={18} />, color: '#FF6600' },
    { key: 'script', label: 'Script Generation', icon: <PenTool size={18} />, color: '#00D1FF' },
    { key: 'description', label: 'Metadata & Tags', icon: <MessageSquare size={18} />, color: '#9D50BB' },
    { key: 'thumbnail', label: 'Thumbnail Concept', icon: <Edit3 size={18} />, color: '#FFD700' },
    { key: 'shorts', label: 'Shorts Adaptation', icon: <Video size={18} />, color: '#FF00A8' }
  ];

  useEffect(() => {
    if (channelData?.id) {
      fetchVersions();
    }
  }, [channelData?.id]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('channel_id', channelData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVersions(data || []);

      const active = data?.find(v => v.is_active);
      if (active) {
        setSelectedVersionId(active.id);
        setEditForm({
          name: active.name,
          audio: active.audio,
          script: active.script,
          description: active.description,
          thumbnail: active.thumbnail,
          shorts: active.shorts
        });
      } else {
        // Fallback: Use the data passed from the channels table (the current existing prompts)
        const virtualVersion = {
          id: 'live-system',
          name: 'Active System Configuration',
          audio: channelData.audio || '',
          script: channelData.script || '',
          description: channelData.description || '',
          thumbnail: channelData.thumbnail || '',
          shorts: channelData.shorts || '',
          is_active: true,
          created_at: new Date().toISOString(),
          is_virtual: true
        };

        // Add to versions if it's empty to show it in sidebar
        if (!data || data.length === 0) {
          setVersions([virtualVersion]);
        }

        setSelectedVersionId('live-system');
        setEditForm(virtualVersion);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
      // Fallback if table doesn't exist yet
      if (err.code === '42P01') {
        setStatus({ type: 'warning', message: '⚠️ Schema migration recommended for full versioning support.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (v) => {
    setSelectedVersionId(v.id);
    setEditForm({
      name: v.name,
      audio: v.audio,
      script: v.script,
      description: v.description,
      thumbnail: v.thumbnail,
      shorts: v.shorts
    });
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setEditForm({
      name: `v${versions.length + 1} - ${new Date().toLocaleDateString()}`,
      audio: '',
      script: '',
      description: '',
      thumbnail: '',
      shorts: ''
    });
    setIsEditing(true);
  };

  const handleSave = async (isNew = false) => {
    try {
      setSaving(true);
      const payload = {
        channel_id: channelData.id,
        name: editForm.name,
        audio: editForm.audio,
        script: editForm.script,
        description: editForm.description,
        thumbnail: editForm.thumbnail,
        shorts: editForm.shorts,
        created_at: new Date().toISOString()
      };

      if (isNew || !selectedVersionId) {
        const { data, error } = await supabase
          .from('prompt_versions')
          .insert([payload])
          .select();
        if (error) throw error;
        setStatus({ type: 'success', message: '✅ NEW VERSION CREATED' });
        fetchVersions();
      } else {
        const { error } = await supabase
          .from('prompt_versions')
          .update(payload)
          .eq('id', selectedVersionId);
        if (error) throw error;
        setStatus({ type: 'success', message: '✅ VERSION UPDATED' });
        fetchVersions();
      }
      setIsEditing(false);
    } catch (err) {
      setStatus({ type: 'error', message: `❌ SAVE FAILED: ${err.message}` });
    } finally {
      setSaving(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleSetActive = async (id) => {
    try {
      setSaving(true);

      // 1. Mark all as inactive for this channel
      await supabase
        .from('prompt_versions')
        .update({ is_active: false })
        .eq('channel_id', channelData.id);

      // 2. Mark this one as active
      const { data: updatedVersion, error } = await supabase
        .from('prompt_versions')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 3. Sync with main channels table
      const { error: syncError } = await supabase
        .from('channels')
        .update({
          audio_prompt: updatedVersion.audio,
          script_prompt: updatedVersion.script,
          description_prompt: updatedVersion.description,
          thumbnail_prompt: updatedVersion.thumbnail,
          shorts_prompt: updatedVersion.shorts
        })
        .eq('id', channelData.id);

      if (syncError) throw syncError;

      onUpdateActivePrompts({
        audio: updatedVersion.audio,
        script: updatedVersion.script,
        description: updatedVersion.description,
        thumbnail: updatedVersion.thumbnail,
        shorts: updatedVersion.shorts
      });

      setStatus({ type: 'success', message: '🚀 VERSION DEPLOYED AS ACTIVE' });
      fetchVersions();
    } catch (err) {
      setStatus({ type: 'error', message: `❌ ACTIVATION FAILED: ${err.message}` });
    } finally {
      setSaving(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatus({ type: 'info', message: `📋 COPIED: ${label}` });
    setTimeout(() => setStatus({ type: '', message: '' }), 2000);
  };

  if (loading) return <div className="loader">INITIALIZING HUB...</div>;

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  return (
    <div className="prompt-hub-container animate-fade">
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="main-title" style={{ marginBottom: '4px' }}>
            Neural Prompt Hub <span style={{ fontSize: '0.8rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', marginLeft: '10px', verticalAlign: 'middle' }}>V2.0</span>
          </h1>
          <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>
            MANAGE AI ARCHITECTURES AND VERSION HISTORY.
          </p>
        </div>
        <div className="hub-actions">
          <button className="copy-btn" onClick={handleCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> NEW ARCHIVE
          </button>
        </div>
      </div>

      <div className="hub-layout">
        {/* Version Sidebar */}
        <div className="hub-sidebar">
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={14} /> Version History
          </div>
          <div className="version-list">
            {versions.map(v => (
              <div
                key={v.id}
                className={`version-item ${selectedVersionId === v.id ? 'active' : ''} ${v.is_active ? 'working' : ''}`}
                onClick={() => handleSelectVersion(v)}
              >
                <div className="version-meta">
                  <span className="version-name">{v.name}</span>
                  <span className="version-date"><Clock size={10} /> {new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                {v.is_active && <div className="active-badge">ACTIVE</div>}
              </div>
            ))}
            {versions.length === 0 && (
              <div className="version-empty">No versions archived for this channel.</div>
            )}
          </div>
        </div>

        {/* Main Editor/Viewer */}
        <div className="hub-main">
          {isEditing || !selectedVersionId ? (
            <div className="prompt-editor animate-fade">
              <div className="editor-header">
                <input
                  className="version-name-input"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Version Name (e.g. Optimized v2.1)"
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="copy-btn" onClick={() => setIsEditing(false)}>CANCEL</button>
                  <button className="google-login-btn" style={{ height: '40px', padding: '0 20px' }} onClick={() => handleSave(!selectedVersionId || selectedVersionId === 'live-system')}>
                    <Save size={16} /> {saving ? 'SAVING...' : 'SAVE VERSION'}
                  </button>
                </div>
              </div>

              <div className="editor-grid">
                {promptTypes.map(type => (
                  <div key={type.key} className="editor-field-card">
                    <div className="field-label" style={{ color: type.color }}>
                      {type.icon} {type.label}
                    </div>
                    <textarea
                      className="field-textarea"
                      value={editForm[type.key]}
                      onChange={e => setEditForm({ ...editForm, [type.key]: e.target.value })}
                      placeholder={`Enter ${type.label.toLowerCase()} prompt here...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="prompt-viewer animate-fade">
              {!selectedVersion ? (
                <div className="loader">SELECT A VERSION TO VIEW</div>
              ) : (
                <>
                  <div className="viewer-header">
                    <div className="viewer-info">
                      <h2>{selectedVersion.name}</h2>
                      <span className="timestamp">ARCHIVED ON {new Date(selectedVersion.created_at).toLocaleString()}</span>
                    </div>
                    <div className="viewer-actions">
                      <button className="copy-btn" onClick={() => setIsEditing(true)}>
                        <Edit3 size={16} /> CLONE TO NEW VERSION
                      </button>
                      {selectedVersion.is_virtual ? (
                        <div className="active-badge" style={{ position: 'static', padding: '8px 16px', fontSize: '0.8rem' }}>
                          <Play size={14} /> LIVE SYSTEM ACTIVE
                        </div>
                      ) : (
                        <button
                          className={`google-login-btn ${selectedVersion.is_active ? 'disabled' : ''}`}
                          style={{ height: '40px', padding: '0 20px' }}
                          onClick={() => handleSetActive(selectedVersion.id)}
                          disabled={selectedVersion.is_active || saving}
                        >
                          <Play size={16} /> {selectedVersion.is_active ? 'CURRENT WORKING' : 'DEPLOY AS WORKING'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="professional-prompt-workspace">
                    <div className="prompt-category-selector">
                      {promptTypes.map(type => (
                        <div
                          key={type.key}
                          className={`category-item ${activePromptCategory === type.key ? 'active' : ''}`}
                          onClick={() => setActivePromptCategory(type.key)}
                          style={{ '--accent': type.color }}
                        >
                          <div className="category-icon">{type.icon}</div>
                          <div className="category-info">
                            <span className="category-label">{type.label}</span>
                            <span className="category-status">Establish Ready</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="prompt-display-area animate-fade" key={activePromptCategory}>
                      <div className="display-header">
                        <div className="display-title" style={{ color: promptTypes.find(t => t.key === activePromptCategory)?.color }}>
                          {promptTypes.find(t => t.key === activePromptCategory)?.icon}
                          {promptTypes.find(t => t.key === activePromptCategory)?.label}
                        </div>
                        <button className="copy-btn" onClick={() => handleCopy(selectedVersion[activePromptCategory], activePromptCategory)}>
                          <Copy size={16} /> COPY TO CLIPBOARD
                        </button>
                      </div>
                      <div className="display-body">
                        {selectedVersion[activePromptCategory] || <span style={{ opacity: 0.3 }}>No architectural data established for this category.</span>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {status.message && (
        <div className={`hub-status-toast ${status.type} animate-fade`}>
          {status.type === 'success' ? <CheckCircle2 size={16} /> : status.type === 'error' ? <AlertCircle size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .prompt-hub-container { height: 100%; display: flex; flex-direction: column; }
        .hub-layout { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; flex: 1; min-height: 0; }
        .hub-sidebar { background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
        .version-list { display: flex; flex-direction: column; gap: 8px; }
        .version-item { padding: 1rem; background: rgba(255,102,0,0.03); border: 1px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.2s; position: relative; }
        .version-item:hover { border-color: var(--primary); background: var(--glass); }
        .version-item.active { border-color: var(--primary); background: rgba(255,102,0,0.1); box-shadow: 0 4px 15px rgba(255,102,0,0.1); }
        .version-item.working { border-left: 4px solid var(--primary); }
        .version-name { display: block; font-weight: 700; font-size: 0.9rem; color: var(--text-main); margin-bottom: 4px; }
        .version-date { font-size: 0.7rem; color: var(--text-muted); display: flex; alignItems: center; gap: 4px; }
        .active-badge { position: absolute; top: 10px; right: 10px; font-size: 0.6rem; font-weight: 900; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; }
        
        .hub-main { min-height: 0; overflow-y: auto; }
        .editor-header, .viewer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 1.5rem; background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; }
        .viewer-actions { display: flex; align-items: center; gap: 15px; }
        .version-name-input { background: none; border: none; border-bottom: 2px solid var(--border); color: white; font-size: 1.5rem; font-weight: 800; font-family: 'Outfit'; width: 100%; max-width: 400px; padding: 8px 0; outline: none; transition: border-color 0.2s; }
        .version-name-input:focus { border-color: var(--primary); }
        
        .editor-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        .editor-field-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; }
        .field-label { font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
        .field-textarea { width: 100%; height: 120px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 12px; color: white; padding: 1rem; font-family: 'Inter'; font-size: 0.95rem; line-height: 1.6; outline: none; resize: vertical; }
        .field-textarea:focus { border-color: var(--primary); box-shadow: 0 0 15px rgba(255,102,0,0.1); }
        
        .viewer-info h2 { margin: 0 0 4px 0; font-family: 'Outfit'; font-size: 2rem; }
        .viewer-info .timestamp { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px; }
        
        .professional-prompt-workspace { display: grid; grid-template-columns: 240px 1fr; gap: 1rem; background: rgba(0,0,0,0.2); border-radius: 20px; border: 1px solid var(--border); overflow: hidden; height: 500px; }
        .prompt-category-selector { background: rgba(255,255,255,0.02); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .category-item { padding: 1.25rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,102,0,0.05); }
        .category-item:hover { background: rgba(255,255,255,0.05); }
        .category-item.active { background: var(--glass); border-left: 4px solid var(--accent); }
        .category-icon { color: var(--accent); }
        .category-info { display: flex; flex-direction: column; }
        .category-label { font-weight: 700; font-size: 0.85rem; color: var(--text-main); }
        .category-status { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        
        .prompt-display-area { display: flex; flex-direction: column; overflow: hidden; }
        .display-header { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
        .display-title { font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
        .display-body { padding: 2rem; font-size: 1rem; line-height: 1.8; color: rgba(255,255,255,0.9); overflow-y: auto; flex: 1; font-family: 'Inter'; white-space: pre-wrap; }
        
        .hub-status-toast { position: fixed; bottom: 30px; right: 30px; padding: 1rem 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 0.9rem; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
        .hub-status-toast.success { background: rgba(16, 185, 129, 0.9); color: white; }
        .hub-status-toast.error { background: rgba(239, 68, 68, 0.9); color: white; }
        .hub-status-toast.info { background: rgba(59, 130, 246, 0.9); color: white; }
        .hub-status-toast.warning { background: rgba(245, 158, 11, 0.9); color: white; }
      `}} />
    </div>
  );
};

export default PromptHub;
