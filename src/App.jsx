import React, { useState, useEffect } from 'react';
import { Copy, Layers, List, PenTool, Radio, ExternalLink, Command, ShieldCheck, AlignCenter, Brush, Music, MessageSquare, Video, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Calendar, LayoutDashboard, Activity, CheckCircle2, Clock, Globe, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';
import Login from './Login';
import Security from './Security';
import PromptHub from './PromptHub';


const niceDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${dayName}, ${dd}-${mm}-${y}`;
  } catch (e) {
    return dateStr;
  }
};

const openInNewWindow = (e, url) => {
  if (e) e.preventDefault();
  // Using screen.availWidth and screen.availHeight to make the window take up the full screen
  const width = window.screen.availWidth;
  const height = window.screen.availHeight;
  const left = 0;
  const top = 0;
  const windowFeatures = `width=${width},height=${height},top=${top},left=${left},popup=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;
  window.open(url, `win_${Date.now()}_${Math.floor(Math.random() * 1000)}`, windowFeatures);
};

const Dashboard = ({ data, channels, onViewChange, onTitleClick }) => {
  const [detailMetric, setDetailMetric] = useState(null);
  const allIdeas = Object.values(data.styles).flat();
  const totalVideos = allIdeas.length;
  const bookedVideos = allIdeas.filter(i => i.date).length;
  const completedVideos = allIdeas.filter(i => i.completed).length;
  const channelCount = channels.length;

  const pipeline = [];
  Object.entries(data.styles).forEach(([style, ideas]) => {
    ideas.forEach(i => {
      if (i.date && !i.completed) {
        pipeline.push({ ...i, style });
      }
    });
  });
  pipeline.sort((a, b) => a.date.localeCompare(b.date));

  const progress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  // Milestone Logic
  const bookedDates = allIdeas.map(i => i.date).filter(Boolean).sort();
  const firstBookedDate = bookedDates.length > 0 ? bookedDates[0] : null;

  let milestoneInfo = null;
  if (firstBookedDate) {
    const start = new Date(firstBookedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today - start;
    const daysSinceStart = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const milestones = [
      { days: 50, label: '50 Days' },
      { days: 100, label: '100 Days' },
      { days: 365, label: '1 Year' },
      { days: 730, label: '2 Years' }
    ];

    const nextMilestone = milestones.find(m => m.days > daysSinceStart);

    if (nextMilestone) {
      const mDate = new Date(start);
      mDate.setDate(mDate.getDate() + nextMilestone.days);

      const prevMilestoneIndex = milestones.indexOf(nextMilestone) - 1;
      const prevMilestone = milestones[prevMilestoneIndex];
      const prevLabel = prevMilestone?.label || 'Day 1';
      const prevDays = prevMilestone?.days || 0;

      const pDate = new Date(start);
      pDate.setDate(pDate.getDate() + prevDays);

      const totalRange = nextMilestone.days - prevDays;
      const currentProgressInRange = daysSinceStart - prevDays;
      const percent = Math.min(100, Math.max(0, Math.round((currentProgressInRange / totalRange) * 100)));

      milestoneInfo = {
        currentDays: daysSinceStart + 1,
        nextLabel: nextMilestone.label,
        nextDate: `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}-${String(mDate.getDate()).padStart(2, '0')}`,
        prevLabel,
        prevDate: `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`,
        daysLeft: nextMilestone.days - daysSinceStart,
        percent
      };
    } else {
      milestoneInfo = {
        currentDays: daysSinceStart + 1,
        completed: true
      };
    }
  }

  // Metric Details Mapping
  const getMetricDetail = (type) => {
    switch (type) {
      case 'database':
        const styleStats = Object.entries(data.styles).map(([name, ideas]) => ({ name, count: ideas.length }));
        return {
          title: "Database Breakdown",
          content: styleStats.map(s => <div key={s.name} className="detail-row"><span>{s.name}</span><strong>{s.count}</strong></div>)
        };
      case 'scheduled':
        return {
          title: "Upcoming Schedule",
          content: pipeline.slice(0, 5).map(p => (
            <div key={p.id} className="detail-row">
              <span
                className="title-text-interactive"
                onClick={() => onTitleClick({ ...p, sheetName: p.style })}
              >
                {p.title}
              </span>
              <strong>{niceDate(p.date)}</strong>
            </div>
          ))
        };
      case 'completed':
        const recentCompleted = allIdeas.filter(i => i.completed).slice(-5).reverse();
        return {
          title: "Recently Completed",
          content: recentCompleted.map(p => {
            // Find which style this video belongs to
            const style = Object.keys(data.styles).find(s => data.styles[s].some(idea => idea.id === p.id));
            return (
              <div key={p.id} className="detail-row">
                <span
                  className="title-text-interactive"
                  onClick={() => onTitleClick({ ...p, sheetName: style })}
                >
                  {p.title}
                </span>
                <strong>COMPLETED</strong>
              </div>
            );
          })
        };
      case 'channels':
        return {
          title: "YouTube Channels",
          content: channels.map(c => <div key={c} className="detail-row"><span>{c}</span><strong>ONLINE</strong></div>)
        };
      default: return null;
    }
  };

  const detail = detailMetric ? getMetricDetail(detailMetric) : null;

  return (
    <div className="dashboard-container animate-fade">
      <div className="dashboard-header">
        <div>
          <h1 className="main-title" style={{ marginBottom: '4px' }}>Command Center</h1>
          <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>
            WELCOME BACK, SIR. ALL SYSTEMS ARE NOMINAL.
          </p>
        </div>
        <div className="system-time">
          <Clock size={14} /> {new Date().toLocaleTimeString()}
        </div>
      </div>

      {milestoneInfo && (
        <div className="milestone-container animate-fade">
          <div className="milestone-card">
            <div className="milestone-main">
              <div className="milestone-day-count">
                <span className="count-num">Day {milestoneInfo.currentDays}</span>
                <span className="count-alt">Since Launch</span>
              </div>

              {!milestoneInfo.completed ? (
                <div className="milestone-progress-area">
                  <div className="milestone-objective-display">
                    <div>OBJECTIVE: {milestoneInfo.nextLabel}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Calendar size={12} /> {niceDate(milestoneInfo.nextDate)}
                    </div>
                  </div>

                  <div className="milestone-progress-bar-wrapper">
                    <div className="milestone-edge-label-group">
                      <span className="milestone-edge-label">{milestoneInfo.prevLabel}</span>
                      <span className="milestone-edge-date">{niceDate(milestoneInfo.prevDate).split(', ')[1]}</span>
                    </div>

                    <div className="milestone-progress-bar">
                      <div className="milestone-progress-fill" style={{ width: `${milestoneInfo.percent}%` }}>
                        <div className="progress-glow"></div>
                      </div>
                    </div>

                    <div className="milestone-edge-label-group align-right">
                      <span className="milestone-edge-label">{milestoneInfo.nextLabel}</span>
                      <span className="milestone-edge-date">{niceDate(milestoneInfo.nextDate).split(', ')[1]}</span>
                    </div>
                  </div>

                  <div className="milestone-footer-row">
                    <span>{milestoneInfo.percent}% COMPLETE</span>
                    <span className="days-remaining">T-MINUS {milestoneInfo.daysLeft} DAYS</span>
                  </div>
                </div>
              ) : (
                <div className="milestone-completed">
                  <span className="completed-text"><Sparkles size={16} /> ALL MAJOR MILESTONES ACHIEVED</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-hub-links">
        <div className="hub-link-card" onClick={() => onViewChange('prompts')}>
          <div className="hub-link-icon-wrapper">
            <Sparkles size={24} />
          </div>
          <div className="hub-link-content">
            <div className="hub-link-title">Prompt Hub</div>
            <div className="hub-link-desc">Access AI tools & templates</div>
          </div>
          <div className="hub-link-arrow">
            <ChevronRight size={20} />
          </div>
        </div>

        <div className="hub-link-card" onClick={() => onViewChange('calendar')}>
          <div className="hub-link-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div className="hub-link-content">
            <div className="hub-link-title">Calendar</div>
            <div className="hub-link-desc">View deployment schedule</div>
          </div>
          <div className="hub-link-arrow">
            <ChevronRight size={20} />
          </div>
        </div>

        <div className="hub-link-card" onClick={() => onViewChange('security')}>
          <div className="hub-link-icon-wrapper">
            <ShieldCheck size={24} />
          </div>
          <div className="hub-link-content">
            <div className="hub-link-title">Security</div>
            <div className="hub-link-desc">Manage access password</div>
          </div>
          <div className="hub-link-arrow">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      <div className="dashboard-hero-compact">
        <div className="hero-compact-stats">
          <div className="compact-hero-label">Mission Protocol</div>
          <div className="hero-value-large">{progress}%</div>
          <p className="hero-status-text">ACTIVE OPERATIONS IN PROGRESS, SIR.</p>
        </div>

        <div className="hero-channel-link">
          <div className="link-glitch-wrapper">
            <span className="link-tag">UPLINK STATUS: ESTABLISHED</span>
            <div className="link-main">
              {data.channelLink && data.channelLink !== 'channel link NA' ? (
                <a
                  href={data.channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hyper-link"
                  onClick={(e) => openInNewWindow(e, data.channelLink)}
                >
                  <Globe size={14} className="link-icon" />
                  CHANNEL ACCESS
                  <ExternalLink size={12} className="link-arrow" />
                </a>
              ) : (
                <span className="link-na">CHANNEL LINK NA</span>
              )}
            </div>
            <div className="link-footer">DIRECT NEURAL CONNECTION ACTIVE</div>
          </div>
        </div>

        <div className="hero-compact-hud">
          <div className="hud-ring outer"></div>
          <div className="hud-ring middle"></div>
          <div className="hud-ring inner">
            <span className="hud-percent">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sidebar">
        <div className="protocol-card">
          <div className="protocol-title">
            <Activity size={18} /> Active Pipeline
          </div>
          {pipeline.slice(0, 4).map((item, idx) => (
            <div key={idx} className="pipeline-item">
              <span className="item-style" onClick={() => onViewChange('pipeline')}>{item.style}</span>
              <span
                className="item-title title-text-interactive"
                onClick={() => onTitleClick({ ...item, sheetName: item.style })}
              >
                {item.title}
              </span>
              <div className="item-footer">
                <span className="item-date"><Clock size={12} /> {niceDate(item.date)}</span>
                <span className="status-badge">STANDBY</span>
              </div>
            </div>
          ))}
          {pipeline.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem' }}>Sir, no pending deployments in pipeline.</p>
          )}
        </div>
      </div>

      <div className="dashboard-metrics">
        <div className="metric-card" onClick={() => setDetailMetric('database')}>
          <div className="metric-icon"><Globe size={20} /></div>
          <div className="metric-info">
            <span className="metric-val">{totalVideos}</span>
            <span className="metric-lab">Total Database</span>
          </div>
        </div>
        <div className="metric-card" onClick={() => setDetailMetric('scheduled')}>
          <div className="metric-icon"><Calendar size={20} /></div>
          <div className="metric-info">
            <span className="metric-val">{bookedVideos}</span>
            <span className="metric-lab">Scheduled</span>
          </div>
        </div>
        <div className="metric-card" onClick={() => setDetailMetric('completed')}>
          <div className="metric-icon"><CheckCircle2 size={20} /></div>
          <div className="metric-info">
            <span className="metric-val">{completedVideos}</span>
            <span className="metric-lab">Completed</span>
          </div>
        </div>
        <div className="metric-card" onClick={() => setDetailMetric('channels')}>
          <div className="metric-icon"><Radio size={20} /></div>
          <div className="metric-info">
            <span className="metric-val">{channelCount}</span>
            <span className="metric-lab">Channels Online</span>
          </div>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetailMetric(null)}>
          <div className="detail-modal animate-fade" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <span>{detail.title}</span>
              <button className="close-detail" onClick={() => setDetailMetric(null)}>×</button>
            </div>
            <div className="detail-content">
              {detail.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [data, setData] = useState({
    prompts: { audio: '', script: '', description: '', thumbnail: '', shorts: '' },
    styles: {},
    channelLink: 'channel link NA'
  });
  const [view, setView] = useState('dashboard'); // 'dashboard', 'prompts', 'style', 'calendar', 'pipeline'
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedText, setCopiedText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [channels, setChannels] = useState([]); // [{id, name}]
  const [selectedChannel, setSelectedChannel] = useState(null); // {id, name}

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [toastPos, setToastPos] = useState({ x: 0, y: 0 });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [datePickerIdea, setDatePickerIdea] = useState(null);
  const [linksIdea, setLinksIdea] = useState(null);
  const fonts = ['Inter', 'Outfit', 'Playfair Display', 'Montserrat', 'Syne', 'Space Grotesk', 'Caveat'];

  const getFontForItem = (index) => fonts[index % fonts.length];

  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data: list, error: fetchError } = await supabase
        .from('channels')
        .select('id, name')
        .order('name');

      if (fetchError) throw fetchError;

      setChannels(list);
      if (list.length > 0) {
        setSelectedChannel(list[0]);
      } else {
        setLoading(false);
        // Don't set error here, maybe user just hasn't migrated data yet
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch channels from Supabase.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchChannels();
    }
    const closeDropdown = () => setIsDropdownOpen(false);
    document.addEventListener('click', closeDropdown);
    return () => {
      document.removeEventListener('click', closeDropdown);
    };
  }, [session]);

  useEffect(() => {
    if (selectedChannel && session) {
      fetchData(selectedChannel.name);
    }
  }, [selectedChannel, session]);

  const fetchData = async (channelName) => {
    try {
      setLoading(true);

      // 1. Get Channel Data
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('name', channelName)
        .single();

      if (channelError) throw channelError;

      // 2. Get Styles and Ideas
      const { data: stylesData, error: stylesError } = await supabase
        .from('video_styles')
        .select(`
          name,
          ideas (*)
        `)
        .eq('channel_id', channelData.id);

      if (stylesError) throw stylesError;

      const formattedStyles = {};
      stylesData.forEach(style => {
        formattedStyles[style.name] = style.ideas.sort((a, b) => (a.sn || 0) - (b.sn || 0));
      });

      setData({
        prompts: {
          audio: channelData.audio_prompt,
          script: channelData.script_prompt,
          description: channelData.description_prompt,
          thumbnail: channelData.thumbnail_prompt,
          shorts: channelData.shorts_prompt
        },
        styles: formattedStyles,
        channelLink: channelData.channel_link
      });

      const styleNames = Object.keys(formattedStyles);
      if (styleNames.length > 0 && !selectedStyle) {
        setSelectedStyle(styleNames[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Supabase data.');
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sheetName, rowId, status) => {
    try {
      // Optimistic update
      const updatedData = { ...data };
      const item = updatedData.styles[sheetName].find(i => i.id === rowId);
      if (item) item.completed = status;
      setData(updatedData);

      const { error } = await supabase
        .from('ideas')
        .update({ completed: status })
        .eq('id', rowId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchData(selectedChannel.name);
    }
  };

  const handleUpdateDate = async (sheetName, rowId, date) => {
    try {
      // Optimistic update
      const updatedData = { ...data };
      const item = updatedData.styles[sheetName].find(i => i.id === rowId);
      if (item) item.date = date;
      setData(updatedData);

      const { error } = await supabase
        .from('ideas')
        .update({ date: date || null })
        .eq('id', rowId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update date:', err);
      fetchData(selectedChannel.name);
    }
  };

  const handleUpdateLinks = async (sheetName, rowId, links) => {
    try {
      // Optimistic update
      const updatedData = { ...data };
      const item = updatedData.styles[sheetName].find(i => i.id === rowId);
      if (item) item.links = links;
      setData(updatedData);

      const { error } = await supabase
        .from('ideas')
        .update({ links: links })
        .eq('id', rowId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update links:', err);
      fetchData(selectedChannel.name);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCopy = (e, text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    if (e) {
      setToastPos({ x: e.clientX, y: e.clientY });
    }
    setTimeout(() => setCopiedText(''), 2000);
  };

  if (!session) {
    return <Login />;
  }

  // Restrict to specific email
  if (session.user.email !== 'ramsaiyenugadhati@gmail.com') {
    return (
      <div className="login-container">
        <div className="login-card animate-fade">
          <ShieldCheck size={64} color="var(--primary)" />
          <h1>Access Denied</h1>
          <p className="login-desc">Unauthorized access detected. This terminal is restricted to ramsaiyenugadhati@gmail.com.</p>
          <button className="google-login-btn" onClick={handleLogout}>Back to Login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader">Loading Command Center...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="error-card">
          <ShieldCheck size={48} color="var(--primary)" />
          <h2>Supabase Connection Issue</h2>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="copy-btn" onClick={() => window.location.reload()}>Retry</button>
            <button className="copy-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const activeIdeas = selectedStyle ? data.styles[selectedStyle] || [] : [];

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && <span>CONTENT HUB</span>}
          <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="channel-selector">
            <div className="section-label" style={{ marginBottom: '8px' }}>Active Channel</div>
            <div className="custom-dropdown" onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}>
              <div className="dropdown-trigger">
                <span className="current-value" style={{ fontFamily: `'${getFontForItem(channels.findIndex(c => c.id === selectedChannel?.id))}', sans-serif` }}>
                  {selectedChannel?.name || 'Select Channel'}
                </span>
                <ChevronDown size={14} className={isDropdownOpen ? 'rotated' : ''} />
              </div>
              {isDropdownOpen && (
                <div className="dropdown-options animate-fade">
                  {channels.map((c, idx) => (
                    <div
                      key={c.id}
                      className={`dropdown-option ${selectedChannel?.id === c.id ? 'selected' : ''}`}
                      style={{ fontFamily: `'${getFontForItem(idx)}', sans-serif` }}
                      onClick={() => {
                        setSelectedChannel(c);
                        setLoading(true);
                      }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="nav-links">
          {!isCollapsed && (
            <>
              <div className="section-label">General</div>
              <div
                className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
                title="Dashboard"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>

              <div
                className={`nav-item ${view === 'pipeline' ? 'active' : ''}`}
                onClick={() => setView('pipeline')}
                title="Pipeline"
              >
                <List size={18} />
                <span>Pipeline</span>
              </div>

              <div
                className={`nav-item ${view === 'security' ? 'active' : ''}`}
                onClick={() => setView('security')}
                title="Security"
              >
                <ShieldCheck size={18} />
                <span>Security</span>
              </div>

              <div
                className={`nav-item ${view === 'prompts' ? 'active' : ''}`}
                onClick={() => setView('prompts')}
                title="Prompt Hub"
              >
                <Sparkles size={18} />
                <span>Prompt Hub</span>
              </div>

              <div className="section-label" style={{ marginTop: '1.5rem' }}>Video Styles</div>
              {Object.entries(data.styles).map(([style, ideas]) => {
                const completed = ideas.filter(i => i.completed).length;
                const total = ideas.length;
                return (
                  <div
                    key={style}
                    className={`nav-item ${view === 'style' && selectedStyle === style ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedStyle(style);
                      setView('style');
                    }}
                    title={`${style} (${completed}/${total})`}
                  >
                    <Layers size={18} />
                    <span className="style-name">{style}</span>
                    <span className="nav-count">({completed}/{total})</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="sidebar-footer">
          {!isCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ marginBottom: '4px' }}>
                Progress: {Object.values(data.styles).flat().filter(i => i.completed).length} / {Object.values(data.styles).flat().length} Done
              </div>
              <button
                className="copy-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleLogout}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <LogOut size={18} style={{ cursor: 'pointer' }} onClick={handleLogout} />
          )}
        </div>
      </div>

      <div className="main-content">
        {view === 'dashboard' ? (
          <Dashboard data={data} channels={channels} onViewChange={(v) => setView(v)} onTitleClick={setLinksIdea} />
        ) : view === 'security' ? (
          <Security />
        ) : view === 'prompts' ? (
          <PromptHub 
            channelData={{
              ...selectedChannel,
              ...data.prompts
            }}
            onUpdateActivePrompts={(newPrompts) => setData(prev => ({ ...prev, prompts: newPrompts }))}
          />
        ) : view === 'calendar' ? (
          <BigCalendar
            data={data}
            onEventClick={(event) => {
              setSelectedStyle(event.sheetName);
              setView('style');
            }}
          />
        ) : (
          <div className="animate-fade">
            {/* Title */}
            <h2 className="main-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {view === 'pipeline' ? <Radio size={24} color="var(--primary)" /> : <List size={24} color="var(--primary)" />}
              {view === 'pipeline' ? 'Scheduled Pipeline' : `${selectedStyle} Ideas`}
            </h2>

            {/* Ideas Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="ideas-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Status</th>
                    {view === 'pipeline' && <th style={{ width: 120 }}>Style</th>}
                    <th style={{ width: 80 }}>SN</th>
                    <th>Video Title</th>
                    <th>Thumbnail Text</th>
                    <th style={{ width: 180 }}>Ready Prompts</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let activeIdeas = [];
                    if (view === 'style') {
                      activeIdeas = selectedStyle ? data.styles[selectedStyle] || [] : [];
                    } else if (view === 'pipeline') {
                      Object.entries(data.styles).forEach(([sheetName, ideas]) => {
                        ideas.forEach(idea => {
                          if (idea.date && !idea.completed) {
                            activeIdeas.push({ ...idea, sheetName });
                          }
                        });
                      });
                      activeIdeas.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                    }

                    if (activeIdeas.length === 0) {
                      return <tr><td colSpan={view === 'pipeline' ? "6" : "5"} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No ideas found.</td></tr>;
                    }

                    return activeIdeas.map((idea, idx) => (
                      <tr key={idx} className={idea.completed ? 'completed-row' : ''}>
                        <td align="center">
                          <input
                            type="checkbox"
                            className="status-checkbox"
                            checked={idea.completed}
                            onChange={(e) => handleUpdateStatus(idea.sheetName || selectedStyle, idea.id, e.target.checked)}
                          />
                        </td>
                        {view === 'pipeline' && (
                          <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.8rem' }}>{idea.sheetName}</td>
                        )}
                        <td className="sn-cell">#{idea.sn || idx + 1}</td>
                        <td className="title-cell">
                          <div className="cell-content">
                            <Calendar
                              size={16}
                              className="calendar-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDatePickerIdea({ ...idea, sheetName: idea.sheetName || selectedStyle });
                              }}
                            />
                            <span
                              className="title-text-interactive"
                              onClick={() => setLinksIdea({ ...idea, sheetName: idea.sheetName || selectedStyle })}
                              title="Click to view/add links"
                            >
                              {idea.title}
                            </span>
                            {idea.date && <span className="date-badge">{niceDate(idea.date)}</span>}
                            {idea.links && idea.links.length > 0 && (
                              <ExternalLink size={12} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                            )}
                            <Copy
                              size={14}
                              className="copy-mini"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(e, idea.title, 'Title');
                              }}
                            />
                          </div>
                        </td>
                        <td className="thumb-cell">
                          <div className="cell-content">
                            {idea.thumbnail || '-'}
                            {idea.thumbnail && (
                              <Copy
                                size={14}
                                className="copy-mini"
                                onClick={(e) => handleCopy(e, idea.thumbnail, 'Thumbnail')}
                              />
                            )}
                          </div>
                        </td>
                        <td align="center">
                          <div className="cell-content" style={{ justifyContent: 'center', gap: '8px' }}>
                            {/* Script */}
                            <PenTool
                              size={18}
                              className="shorts-copy-icon"
                              onClick={(e) => {
                                const prompt = (data.prompts.script || '').replace(/{title}/g, idea.title).replace(/{thumbnail}/g, idea.thumbnail || '');
                                handleCopy(e, prompt, 'Script Prompt');
                              }}
                              title="Copy Script Prompt"
                            />
                            {/* Description */}
                            <AlignCenter
                              size={18}
                              className="shorts-copy-icon"
                              onClick={(e) => {
                                const prompt = (data.prompts.description || '').replace(/{title}/g, idea.title).replace(/{thumbnail}/g, idea.thumbnail || '');
                                handleCopy(e, prompt, 'Description Prompt');
                              }}
                              title="Copy Description Prompt"
                            />
                            {/* Thumbnail */}
                            <Brush
                              size={18}
                              className="shorts-copy-icon"
                              onClick={(e) => {
                                const prompt = (data.prompts.thumbnail || '').replace(/{title}/g, idea.title).replace(/{thumbnail}/g, idea.thumbnail || '');
                                handleCopy(e, prompt, 'Thumbnail Prompt');
                              }}
                              title="Copy Thumbnail Prompt"
                            />
                            {/* Shorts */}
                            <Command
                              size={18}
                              className="shorts-copy-icon"
                              onClick={(e) => {
                                const prompt = (data.prompts.shorts || '').replace(/{title}/g, idea.title).replace(/{thumbnail}/g, idea.thumbnail || '');
                                handleCopy(e, prompt, 'Shorts Prompt');
                              }}
                              title="Copy Shorts Prompt"
                            />
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )
        }
      </div>

      {copiedText && (
        <div className="toast" style={{ top: toastPos.y, left: toastPos.x }}>Copied {copiedText}!</div>
      )}

      {/* Date Picker Modal */}
      {datePickerIdea && (
        <div className="date-picker-overlay" onClick={() => setDatePickerIdea(null)}>
          <div className="calendar-ui" onClick={e => e.stopPropagation()}>
            <div className="calendar-header">
              <h3 style={{ fontFamily: 'Outfit' }}>Schedule Content</h3>
              <button className="collapse-btn" onClick={() => setDatePickerIdea(null)}>×</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--primary)' }}>{datePickerIdea.title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Select a date to schedule this video</p>
            </div>

            <div className="calendar-header" style={{ marginBottom: '1rem' }}>
              <button className="month-nav-btn" style={{ width: 30, height: 30 }} onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate)}
              </span>
              <button className="month-nav-btn" style={{ width: 30, height: 30 }} onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="calendar-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="calendar-day-label">{d}</div>
              ))}
              {(() => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDay = new Date(year, month, 1).getDay();
                const days = [];
                for (let i = 0; i < firstDay; i++) days.push(null);
                for (let i = 1; i <= daysInMonth; i++) days.push(i);

                const today = new Date();

                // Calculate booked dates across all styles with status
                const bookedStatusMap = {};
                Object.values(data.styles).forEach(styleIdeas => {
                  styleIdeas.forEach(idea => {
                    if (idea.date) {
                      bookedStatusMap[idea.date] = idea.completed;
                    }
                  });
                });

                return days.map((day, idx) => {
                  if (day === null) return <div key={idx} className="calendar-day empty"></div>;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = datePickerIdea.date === dateStr;
                  const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                  const isBooked = (dateStr in bookedStatusMap) && !isSelected;
                  const isCompleted = isBooked && bookedStatusMap[dateStr];

                  return (
                    <div
                      key={idx}
                      className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isBooked ? 'booked' : ''} ${isCompleted ? 'completed' : ''}`}
                      title={isBooked ? (isCompleted ? 'Video completed' : 'Video scheduled') : ''}
                      onClick={() => {
                        if (isBooked) return;
                        handleUpdateDate(datePickerIdea.sheetName, datePickerIdea.id, dateStr);
                        setDatePickerIdea(null);
                      }}
                    >
                      {day}
                    </div>
                  );
                });

              })()}
            </div>


            <div className="calendar-actions">
              <button className="copy-btn" onClick={() => {
                handleUpdateDate(datePickerIdea.sheetName, datePickerIdea.id, '');
                setDatePickerIdea(null);
              }}>Clear Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Links Popup Modal */}
      {linksIdea && (
        <LinksPopup
          idea={linksIdea}
          onClose={() => setLinksIdea(null)}
          onUpdate={handleUpdateLinks}
        />
      )}
    </div>
  );
};

// Big Calendar Component
const BigCalendar = ({ data, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  // Collect all events
  const events = [];
  Object.entries(data.styles).forEach(([sheetName, ideas]) => {
    ideas.forEach(idea => {
      if (idea.date) {
        events.push({ ...idea, sheetName });
      }
    });
  });

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  // Summary for the visible month
  const monthEvents = events.filter(e => {
    const [y, m] = e.date.split('-').map(Number);
    return (m - 1) === month && y === year;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const statsByStyle = monthEvents.reduce((acc, e) => {
    acc[e.sheetName] = (acc[e.sheetName] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="big-calendar-container animate-fade">
      <div className="prev-next-controls">
        <button className="month-nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
        <div className="current-month-display">{monthNames[month]} {year}</div>
        <button className="month-nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
      </div>

      <div className="calendar-content-wrapper">
        <div className="calendar-left-column">
          <h2 className="main-title" style={{ margin: '0 0 1.5rem 0' }}>Content Schedule</h2>
          <div className="big-calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="calendar-day-label">{d}</div>
            ))}
            {days.map((day, idx) => (
              <div key={idx} className={`big-calendar-cell ${day === null ? 'empty' : ''} ${isToday(day) ? 'today' : ''}`}>
                {day && (
                  <>
                    <div className="cell-date">{day}</div>
                    <div className="calendar-events">
                      {getEventsForDay(day).map((event, eIdx) => (
                        <div
                          key={eIdx}
                          className={`calendar-event ${event.completed ? 'completed' : ''}`}
                          onClick={() => onEventClick(event)}
                          title={`${event.sheetName}: ${event.title}`}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-right-column">
          <div className="summary-card">
            <h3 className="summary-title"><Radio size={18} /> Month's Summary</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{monthEvents.length}</span>
                <span className="stat-label">Total Videos</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{monthEvents.filter(e => e.completed).length}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            <div className="style-stats-list">
              {Object.entries(statsByStyle).map(([style, count]) => (
                <div key={style} className="style-stat-row">
                  <span className="style-stat-name">{style}</span>
                  <span className="style-stat-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-card">
            <h3 className="summary-title"><Calendar size={18} /> Uploads Schedule</h3>
            <div className="summary-table-container">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {monthEvents.length > 0 ? (
                    monthEvents.map((e, idx) => (
                      <tr key={idx} className={e.completed ? 'completed' : ''}>
                        <td className="summary-date">{niceDate(e.date)}</td>
                        <td className="summary-title-cell">{e.title}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No uploads scheduled</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Links Popup Component
const LinksPopup = ({ idea, onClose, onUpdate }) => {
  const [links, setLinks] = useState(idea.links || []);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const addLink = () => {
    if (!newLinkUrl) return;
    const updatedLinks = [...links, { name: newLinkName || 'Link', url: newLinkUrl }];
    setLinks(updatedLinks);
    setNewLinkName('');
    setNewLinkUrl('');
    onUpdate(idea.sheetName, idea.id, updatedLinks);
  };

  const removeLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    onUpdate(idea.sheetName, idea.id, updatedLinks);
  };

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="calendar-ui" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="calendar-header">
          <h3 style={{ fontFamily: 'Outfit' }}>Video Links</h3>
          <button className="collapse-btn" onClick={onClose}>×</button>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--primary)' }}>{idea.title}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Manage references and project links</p>
        </div>

        <div className="links-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '4px' }}>
          {links.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>No links added yet.</p>
            </div>
          ) : (
            links.map((link, idx) => (
              <div key={idx} className="link-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', flex: 1, marginRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}
                  onClick={(e) => openInNewWindow(e, link.url)}
                >
                  {link.name}: <span style={{ opacity: 0.7, fontWeight: 400 }}>{link.url}</span>
                </a>
                <button onClick={() => removeLink(idx)} style={{ background: 'rgba(255,68,68,0.1)', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>Delete</button>
              </div>
            ))
          )}
        </div>

        <div className="add-link-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,102,0,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Add New Link</div>
          <input
            type="text"
            placeholder="Link Name (e.g. Canva, YouTube)"
            value={newLinkName}
            onChange={e => setNewLinkName(e.target.value)}
            className="custom-input"
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="https://..."
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              className="custom-input"
              style={{ flex: 1 }}
            />
            <button className="copy-btn" style={{ padding: '8px 16px', fontWeight: 700 }} onClick={addLink}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
