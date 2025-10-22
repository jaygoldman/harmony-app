import React, { useState, useMemo, useEffect, useRef } from "react";
import { useMsal } from '@azure/msal-react';
import { useAuth } from './AuthWrapper';

// ======================== LAYOUT CONSTANTS ========================
const LEFT_EXPANDED = 260;
const LEFT_COLLAPSED = 72;

// ======================== SMALL UTILS =============================
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

const isEditableTarget = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return !!(el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
};

const BrandLogo: React.FC<{ url?: string }> = ({ url }) => (
  <div className="w-full flex items-center justify-center">
    <img
      src={
        url ||
        "https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66d0043b5e4615211adc5e1c_conductor-by-sensei-labs-logo-p-500.png"
      }
      alt="Conductor by Sensei Labs"
      className="h-8 w-auto select-none"
    />
  </div>
);

const ChevDown = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevLeftCircle = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.08" />
    <path d="M14 7l-5 5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Card: React.FC<{ 
  title: string;
  subtitle?: string; 
  className?: string; 
  children?: React.ReactNode;
  onMenuClick?: () => void;
  showMenu?: boolean;
  menuContent?: React.ReactNode;
  menuRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ title, subtitle, className, children, onMenuClick, showMenu, menuContent, menuRef }) => (
  <section className={cls("bg-white/60 backdrop-blur-sm border border-purple-200 rounded-2xl shadow-sm", className)}>
    <header className="flex items-center justify-between px-4 py-2 rounded-t-2xl flex-shrink-0" style={{ background: "#8252A7", color: "#fff" }}>
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <span className="text-xs opacity-80">{subtitle}</span>}
      </div>
      <div className="relative" ref={menuRef}>
        <button
          onClick={onMenuClick}
          className="hover:bg-white/10 rounded p-1 transition-colors"
        >
          ⋯
        </button>
        {showMenu && menuContent && (
          <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-xl text-sm min-w-[200px] z-50">
            {menuContent}
          </div>
        )}
      </div>
    </header>
    <div className={cls("p-4", className?.includes('flex') ? 'flex-1 min-h-0' : '')}>{children}</div>
  </section>
);

// ======================== PROJECT HEADER ==========================
const ProjectHeader: React.FC = () => (
  <div className="px-2 mb-6">
    <div className="text-[13px] text-[#513295] font-medium mb-1 cursor-pointer">Transformation - Manufacturing</div>

    <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#211534] flex-shrink-0" aria-hidden="true">
          <rect x="3" y="6" width="18" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
        </svg>
        <h1 className="truncate text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] font-semibold leading-snug text-[#211534]">
          3D print capabilities in each facility
        </h1>
      </div>
      <div className="flex items-center gap-5 text-[12px] md:text-[13px] font-medium text-slate-500 basis-full min-[900px]:basis-auto min-[900px]:ml-auto whitespace-nowrap overflow-x-auto">
        <button className="relative py-1 cursor-pointer text-slate-700">
          Summary
          <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#513295] rounded-full" />
        </button>
        <button className="py-1 cursor-pointer">Board</button>
        <button className="py-1 cursor-pointer flex items-center gap-1">Items <ChevDown /></button>
        <button className="py-1 cursor-pointer">Reviews</button>
        <button className="py-1 cursor-pointer">Files</button>
        <button className="py-1 cursor-pointer">KPIs</button>
        <button className="py-1 cursor-pointer">Timeline</button>
        <button className="py-1 cursor-pointer">Team</button>
        <div className="select-none">⋮</div>
      </div>
    </div>

    <div className="mt-2 border-b border-slate-200" />
  </div>
);

// ======================== LEFT SIDEBAR ============================
const WorkspaceChip: React.FC<{ leftOpen: boolean; onClick: () => void }> = ({ leftOpen, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded-md cursor-pointer">
    <div className="w-8 h-8 rounded-md bg-[#502a8f] grid place-items-center text-white text-sm font-bold select-none">Tr</div>
    {leftOpen && (
      <div className="flex items-center gap-2">
        <div className="text-[15px] font-semibold text-[#211534]">Transformation</div>
        <ChevDown />
      </div>
    )}
  </button>
);

const WorkspaceDropdown: React.FC<{ open: boolean }> = ({ open }) => {
  if (!open) return null;
  return (
    <div className="absolute z-50 mt-1 w-[220px] bg-white rounded-md shadow-xl border border-slate-200">
      <div className="py-2">
        <div className="flex items-center gap-2 px-3 py-2 text-[14px] text-slate-800">👤 My Workspace</div>
        <div className="px-3 py-2">
          <input className="w-full h-8 rounded-md border border-[#c7bfe0] outline-none px-2 text-[13px]" placeholder="Search..." />
        </div>
        {[
          { icon: "📡", label: "Integration" },
          { icon: "🤝", label: "Merger & Acquisitions" },
          { icon: "⚙️", label: "Operations" },
          { icon: "🚀", label: "Transformation", active: true },
          { icon: "📦", label: "Procurement" },
        ].map((item) => (
          <div key={item.label} className={cls("flex items-center gap-3 px-3 py-2 text-[14px]", item.active && "bg-slate-100")}>
            <div className="w-7 h-7 rounded-md bg-[#502a8f] grid place-items-center text-white text-xs font-bold">{item.icon}</div>
            <span className="text-slate-800">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const ChevRightCircle = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.08" />
    <path d="M10 7l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ======================== AGENT DATA ==============================
const AGENTS = [
  { name: "@CFOAgent", desc: "financial oversight, benefits realization, budget vs. plan, Return on Investment (ROI) analysis.", acronyms: ["CFO"] },
  { name: "@ChiefRiskOfficerAgent", desc: "enterprise risk management, dependency failure scenarios, mitigation planning.", acronyms: ["CRO"] },
  { name: "@ChiefComplianceOfficerAgent", desc: "regulatory alignment, audit preparedness, compliance horizon scanning.", acronyms: ["CCO"] },
  { name: "@ChiefTechnicalOfficerAgent", desc: "technical feasibility, integration architecture, technical debt implications.", acronyms: ["CTO"] },
  { name: "@ChiefTransformationOfficerAgent", desc: "strategic alignment, prioritization, benefits tracking.", acronyms: ["CTRO", "CTO"] },
  { name: "@ChiefProcurementOfficerAgent", desc: "vendor dependencies, contract risks, savings alignment.", acronyms: ["CPO"] },
  { name: "@PMODirectorAgent", desc: "delivery assurance, governance orchestration, team performance.", acronyms: ["PMO"] },
  { name: "@ResourcingAgent", desc: "determine whether sufficient resourcing is available, workloads, and burnout", acronyms: ["HR", "Resourcing"] },
  { name: "@ChangeManagementAgent", desc: "workforce readiness, change fatigue signals, capacity modeling, adoption modeling, training gaps, stakeholder sentiment.", acronyms: ["CMO", "OCM", "Change"] },
  { name: "@LegalAgent", desc: "contract exposure, regulatory obligations.", acronyms: ["Legal", "GC"] },
].sort((a, b) => a.name.localeCompare(b.name));

type Agent = typeof AGENTS[number];

// ======================== CHAT MESSAGE TYPES ======================
type MessageType = 'user' | 'harmony' | 'agent';

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  sender?: string; // For agent messages, which agent sent it
  timestamp: Date;
  attachments?: {
    type: 'scenario' | 'widget';
    widgetName?: string;
    widgetData?: any;
  }[];
}

// ======================== SCENARIO PLANNER MODAL ==================
const ScenarioPlanner: React.FC<{ 
  open: boolean; 
  onClose: () => void;
  onAddToChat?: () => void;
}> = ({ open, onClose, onAddToChat }) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-[95vw] max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Scenario Planner</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={onAddToChat}
              className="px-4 py-2 bg-[#502A8F] text-white text-sm font-medium rounded-md hover:bg-[#4a2680] transition-colors"
            >
              Add to Harmony Chat
            </button>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(95vh-80px)]">
          <img 
            src="/images/scenario-planner.png" 
            alt="Scenario Planner Interface"
            className="w-full h-auto max-w-none"
            style={{ maxWidth: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

// ======================== MOBILE CONNECT MODAL ==================
const MobileConnectModal: React.FC<{ 
  open: boolean; 
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { account } = useAuth();
  const { instance, accounts } = useMsal();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [connectionCode, setConnectionCode] = useState<string>('');

  // Generate QR code with short connection code
  useEffect(() => {
    if (open && accounts.length > 0) {
      const generateQRCode = async () => {
        try {
          // Generate a short random connection code (8 characters)
          const code = Math.random().toString(36).substring(2, 10).toUpperCase();
          setConnectionCode(code);
          
          // Acquire token silently from MSAL
          const response = await instance.acquireTokenSilent({
            scopes: ['openid', 'profile', 'email'],
            account: accounts[0]
          });
          
          if (!response.accessToken) {
            console.error('No access token received from MSAL');
            return;
          }
          
          // Register the connection code with the backend
          const apiUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3001' 
            : window.location.origin;
          
          try {
            await fetch(`${apiUrl}/api/mobile/register-code`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${response.accessToken}`
              },
              body: JSON.stringify({
                code: code,
                username: account?.username,
                expiresIn: 600 // 10 minutes in seconds
              })
            });
            
            console.log('Connection code registered:', code);
          } catch (error) {
            console.error('Failed to register connection code:', error);
            return;
          }
          
          // Create simple payload with just code and API URL
          const connectionPayload = {
            code: code,
            apiUrl: window.location.origin
          };
          
          // Convert to JSON string
          const payloadString = JSON.stringify(connectionPayload);
          console.log('Payload string length:', payloadString.length, 'characters');
          
          // Generate QR code URL with the short payload
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payloadString)}`;
          console.log('QR URL generated successfully');
          
          setQrCodeUrl(qrUrl);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
      };
      
      generateQRCode();

      // Refresh QR code every 10 minutes (600000 milliseconds)
      const interval = setInterval(() => {
        generateQRCode();
      }, 10 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [open, account]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span>📱</span>
            <span>Connect Mobile App</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="space-y-3">
            <p className="text-sm text-slate-700 font-medium mb-3">
              Connect your mobile device:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
              <li>Download the "Conductor Mobile" app from the Apple App Store or Google Play Store.</li>
              <li>Open the app on your device and scan the QR code below.</li>
            </ol>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="Connection QR Code" 
                  className="w-[300px] h-[300px]"
                />
              ) : (
                <div className="w-[300px] h-[300px] flex items-center justify-center bg-slate-100 text-slate-400">
                  Generating QR code...
                </div>
              )}
            </div>
            
            {/* Connection Code Display */}
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">Or enter this code manually:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-md text-lg font-mono font-semibold tracking-wider text-slate-900">
                  {connectionCode || '--------'}
                </code>
              </div>
            </div>
            
            {/* Refresh notice */}
            <p className="text-xs text-slate-400 italic text-center">
              Code refreshes every 10 minutes
            </p>
          </div>

          {/* Additional Info */}
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <p className="text-xs text-purple-900">
              <strong>Tip:</strong> The mobile app allows you to receive notifications, 
              view dashboards, and interact with Harmony AI on the go.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================== WIDGET CARD COMPONENT ==================
const WidgetCard: React.FC<{ widgetName: string; widgetData: any }> = ({ widgetName, widgetData }) => {
  const getWidgetIcon = (name: string) => {
    switch (name) {
      case 'Activity Feed':
        return '📋';
      case 'Ask Harmony':
        return '💬';
      case 'Project Reviews':
        return '📊';
      case 'Project Stages':
        return '🎯';
      case 'Net Benefit':
        return '💰';
      case 'Purpose':
        return '🎯';
      case 'Financial Approvals':
        return '✅';
      case 'Risk Assessment':
        return '⚠️';
      default:
        return '📦';
    }
  };

  const renderWidgetPreview = () => {
    let data = widgetData;
    
    // Try to parse if it's a JSON string
    if (typeof widgetData === 'string') {
      try {
        data = JSON.parse(widgetData);
      } catch {
        // If it's not JSON, just display the string
        return <div className="text-xs text-slate-600">{widgetData}</div>;
      }
    }
    
    if (Array.isArray(data)) {
      return (
        <div className="text-xs text-slate-600">
          <div className="font-medium mb-1">{data.length} items</div>
        </div>
      );
    }
    
    // For objects, show key-value pairs
    if (typeof data === 'object' && data !== null) {
      // Ask Harmony text response format
      if (data.content) {
        // Extract first line or first 100 chars of content
        const preview = data.content.split('\n')[0].replace(/\*\*/g, '').substring(0, 100);
        return (
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 flex-shrink-0">Type:</span>
              <span className="font-medium">Text Response</span>
            </div>
            <div className="text-slate-600 italic line-clamp-2">{preview}...</div>
          </div>
        );
      }
      
      // Ask Harmony table response format
      if (data.columns && data.rows) {
        return (
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Type:</span>
              <span className="font-medium">Table</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Columns:</span>
              <span className="font-medium">{data.columns.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rows:</span>
              <span className="font-medium">{data.rows.length}</span>
            </div>
          </div>
        );
      }
      
      // Ask Harmony chart response format
      if (data.chartType && data.data) {
        return (
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Type:</span>
              <span className="font-medium">Chart</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chart Type:</span>
              <span className="font-medium capitalize">{data.chartType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Data Points:</span>
              <span className="font-medium">{data.data.length}</span>
            </div>
          </div>
        );
      }
      
      // Default object display
      return (
        <div className="space-y-1 text-xs text-slate-600">
          {Object.entries(data).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="text-slate-500 truncate">{key}:</span>
              <span className="font-medium truncate">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback for other types
    return <div className="text-xs text-slate-600">{String(data)}</div>;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-2xl">
          {getWidgetIcon(widgetName)}
        </div>
        <div>
          <div className="font-semibold text-sm text-slate-900">{widgetName}</div>
          <div className="text-xs text-slate-500">Widget Context</div>
        </div>
      </div>
      
      {/* Content Preview */}
      {renderWidgetPreview()}
      
      {/* Action Button */}
      <button className="w-full mt-3 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 transition-colors">
        View Full Widget
      </button>
    </div>
  );
};

// ======================== SCENARIO CARD COMPONENT ==================
const ScenarioCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm text-slate-900">Scenario Planner</div>
          <div className="text-xs text-slate-500">3D print capabilities analysis</div>
        </div>
      </div>
      
      {/* Content Preview */}
      <div className="space-y-2 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Projects in Scenario:</span>
          <span className="font-medium">11</span>
        </div>
        <div className="flex justify-between">
          <span>Strategic Alignment:</span>
          <span className="font-medium text-green-600">8.1</span>
        </div>
        <div className="flex justify-between">
          <span>Priority (avg):</span>
          <span className="font-medium">7.3</span>
        </div>
      </div>
      
      {/* Mini Chart */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 mb-2">Resource Utilization</div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full" style={{ width: '73%' }} />
        </div>
        <div className="text-xs text-slate-400 mt-1">73% capacity</div>
      </div>
      
      {/* Action Button */}
      <button className="w-full mt-3 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 transition-colors">
        View Full Scenario
      </button>
    </div>
  );
};

// ======================== MESSAGE CONTENT RENDERER ================
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  // Convert @mentions to pills in message content
  const renderContent = () => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const agentName = part;
        const agent = AGENTS.find(a => a.name === agentName);
        if (agent) {
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#efe8ff] border border-[#c7bfe0] text-[#211534] rounded-md text-xs font-medium mx-0.5"
            >
              {agentName}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };
  
  return <>{renderContent()}</>;
};

// ======================== CHAT MESSAGE COMPONENT ==================
const ChatMessage: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.type === 'user';
  const isHarmony = message.type === 'harmony';
  const isAgent = message.type === 'agent';
  
  return (
    <div className={cls(
      "flex mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cls(
        "max-w-[87.5%] min-w-[60px]", // Increased from 70% to 87.5% (25% wider)
        isUser && "flex flex-col items-end"
      )}>
        {/* Sender label for left-aligned messages */}
        {!isUser && (
          <div className="text-xs text-slate-600 mb-1 px-3">
            {isHarmony ? 'Harmony' : message.sender}
          </div>
        )}
        
        {/* Message bubble */}
        <div className={cls(
          "relative px-4 py-2 rounded-2xl max-w-full break-words",
          // User messages: purple background, white text, right-aligned
          isUser && "bg-[#502A8F] text-white rounded-br-md",
          // Harmony messages: teal background, blue text, left-aligned  
          isHarmony && "bg-[#71E5EE] text-[#3260BA] rounded-bl-md",
          // Agent messages: light purple background, dark text, left-aligned
          isAgent && "bg-[#efe8ff] text-[#211534] border border-[#c7bfe0] rounded-bl-md"
        )}>
          {/* Speech bubble tail */}
          <div className={cls(
            "absolute w-0 h-0 bottom-[-6px]",
            isUser ? (
              // Right tail for user messages (pointing right from bottom)
              "right-3 border-t-[6px] border-t-[#502A8F] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent"
            ) : isHarmony ? (
              // Left tail for harmony messages (pointing left from bottom)
              "left-3 border-t-[6px] border-t-[#71E5EE] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent"
            ) : (
              // Left tail for agent messages (pointing left from bottom)
              "left-3 border-t-[6px] border-t-[#efe8ff] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent"
            )
          )}
          {...(isAgent && {
            style: { filter: 'drop-shadow(-1px 1px 0px #c7bfe0)' } // Add border effect to agent tail
          })}
          />
          
          {/* Message content */}
          <div className="text-sm leading-relaxed">
            <MessageContent content={message.content} />
          </div>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3">
              {message.attachments.map((attachment, index) => {
                if (attachment.type === 'scenario') {
                  return <ScenarioCard key={index} />;
                }
                if (attachment.type === 'widget' && attachment.widgetName) {
                  return <WidgetCard key={index} widgetName={attachment.widgetName} widgetData={attachment.widgetData} />;
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ======================== ASK HARMONY INPUT COMPONENT =============
const AskHarmonyInput: React.FC<{
  placeholder?: string;
  onSendMessage?: (content: string) => void;
}> = ({ placeholder, onSendMessage }) => {
  const [content, setContent] = useState('');
  const editableRef = useRef<HTMLDivElement>(null);
  
  // Handle content changes
  const handleContentChange = () => {
    if (editableRef.current) {
      const newContent = editableRef.current.textContent || '';
      setContent(newContent);
    }
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      
      const messageContent = editableRef.current?.textContent || '';
      if (messageContent.trim() && onSendMessage) {
        onSendMessage(messageContent.trim());
        
        // Clear the input
        if (editableRef.current) {
          editableRef.current.textContent = '';
          setContent('');
        }
      }
      return;
    }
  };
  
  const showPlaceholder = !content;
  
  return (
    <div className="relative">
      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus-within:border-[#513295] focus-within:ring-1 focus-within:ring-[#513295]/20 transition-all duration-200 min-h-[40px]">
        {showPlaceholder && (
          <div className="absolute inset-3 text-slate-400 pointer-events-none text-sm">
            {placeholder || "Ask anything..."}
          </div>
        )}
        <div
          ref={editableRef}
          contentEditable
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          className="outline-none text-sm min-h-[20px] leading-relaxed relative z-10"
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            backgroundColor: 'transparent'
          }}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );
};

// ======================== AGENT INPUT COMPONENT ==================
const AgentInput: React.FC<{
  placeholder?: string;
  onSendMessage?: (content: string, attachments?: { type: 'scenario' }[]) => void;
  addMenuOpen: boolean;
  setAddMenuOpen: (open: boolean) => void;
  uploadSubmenuOpen: boolean;
  setUploadSubmenuOpen: (open: boolean) => void;
  agentsMenuOpen: boolean;
  setAgentsMenuOpen: (open: boolean) => void;
  selectedAgentIndex: number;
  setSelectedAgentIndex: (index: number) => void;
  onOpenScenario: () => void;
  handleAgentSelect: (agent: Agent) => void;
  addMenuRef: React.RefObject<HTMLDivElement | null>;
  agentsMenuRef: React.RefObject<HTMLDivElement | null>;
}> = ({
  placeholder, 
  onSendMessage,
  addMenuOpen,
  setAddMenuOpen,
  uploadSubmenuOpen,
  setUploadSubmenuOpen,
  agentsMenuOpen,
  setAgentsMenuOpen,
  selectedAgentIndex,
  setSelectedAgentIndex,
  onOpenScenario,
  handleAgentSelect,
  addMenuRef,
  agentsMenuRef
}) => {
  const [content, setContent] = useState('');
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);
  const [savedCursorPosition, setSavedCursorPosition] = useState(0);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [isNavigatingMention, setIsNavigatingMention] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ type: 'scenario' }[]>([]);
  const editableRef = useRef<HTMLDivElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  // Filter agents based on mention query
  const filteredAgents = React.useMemo(() => {
    if (!mentionQuery) return AGENTS;
    
    const query = mentionQuery.toLowerCase();
    return AGENTS.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      agent.acronyms?.some(acronym => acronym.toLowerCase().includes(query))
    );
  }, [mentionQuery]);

  // Scroll to selected item in mention menu
  const scrollToSelectedItem = (index: number) => {
    if (!mentionMenuRef.current) return;
    
    const selectedElement = mentionMenuRef.current.querySelector(`[data-agent-index="${index}"]`) as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  // Auto-scroll when selected index changes
  React.useEffect(() => {
    if (showMentionMenu) {
      scrollToSelectedItem(selectedMentionIndex);
    }
  }, [selectedMentionIndex, showMentionMenu]);

  // Detect @ mentions in text
  const detectMention = (text: string, cursorPos: number) => {
    console.log('detectMention called:', { text, cursorPos });
    
    // Don't trigger mention detection if we have pills (they contain @)
    if (editableRef.current && editableRef.current.querySelector('[data-agent]')) {
      // Check if cursor is actually in a text node, not after a pill
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        
        // If cursor is right after a pill element, don't trigger mention
        if (container.nodeType === Node.ELEMENT_NODE) {
          const previousSibling = container.previousSibling;
          if (previousSibling && (previousSibling as HTMLElement).hasAttribute?.('data-agent')) {
            console.log('Cursor is after a pill, not triggering mention');
            setShowMentionMenu(false);
            setMentionQuery('');
            return;
          }
        }
      }
    }
    
    const beforeCursor = text.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    console.log('Before cursor:', JSON.stringify(beforeCursor), 'atIndex:', atIndex);
    
    if (atIndex === -1) {
      console.log('No @ found');
      setShowMentionMenu(false);
      setMentionQuery('');
      setSelectedMentionIndex(0);
      setMentionStartPos(0);
      return;
    }
    
    const afterAt = beforeCursor.slice(atIndex + 1);
    console.log('After @:', JSON.stringify(afterAt));
    
    // Check if there's a space or other delimiter after @
    if (afterAt.includes(' ') || afterAt.includes('\n')) {
      console.log('Space or newline after @, not triggering mention');
      setShowMentionMenu(false);
      setMentionQuery('');
      setSelectedMentionIndex(0);
      setMentionStartPos(0);
      return;
    }
    
    // Show mention menu
    console.log('Showing mention menu with query:', afterAt);
    setMentionStartPos(atIndex);
    setMentionQuery(afterAt);
    setShowMentionMenu(true);
    setSelectedMentionIndex(0);
  };

  // Save cursor position when @ menu might open
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setSavedCursorPosition(range.startOffset);
    }
  };

  // Insert agent from mention (replaces @query with pill)
  const insertMentionAgent = (agent: Agent) => {
    const editable = editableRef.current;
    if (!editable) return;
    
    console.log('insertMentionAgent called:', { agent: agent.name, mentionStartPos, mentionQuery });
    
    // Find the actual position in the DOM to insert the pill
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Create the pill element
    const pill = document.createElement('span');
    pill.className = 'inline-flex items-center gap-1 px-2 py-1 bg-[#efe8ff] border border-[#c7bfe0] text-[#211534] rounded-md text-xs font-medium mx-1 group';
    pill.contentEditable = 'false';
    pill.setAttribute('data-agent', agent.name);
    
    const agentText = document.createElement('span');
    agentText.textContent = agent.name;
    pill.appendChild(agentText);
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'ml-1 text-slate-500 hover:text-slate-700 leading-none opacity-0 group-hover:opacity-100';
    removeBtn.onclick = () => removeAgent(agent);
    pill.appendChild(removeBtn);
    
    // Find and remove the @query text
    const textContent = getTextContentExcludingPills();
    const queryStart = textContent.lastIndexOf('@' + mentionQuery);
    
    if (queryStart !== -1) {
      // Walk through text nodes to find the actual DOM position
      const walker = document.createTreeWalker(
        editable,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip text inside pill elements
            let parent = node.parentNode;
            while (parent && parent !== editable) {
              if ((parent as HTMLElement).hasAttribute?.('data-agent')) {
                return NodeFilter.FILTER_REJECT;
              }
              parent = parent.parentNode;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      let currentPos = 0;
      let targetNode: Node | null = null;
      let targetOffset = 0;
      
      let node;
      while (node = walker.nextNode()) {
        const nodeLength = node.textContent?.length || 0;
        if (currentPos + nodeLength > queryStart) {
          targetNode = node;
          targetOffset = queryStart - currentPos;
          break;
        }
        currentPos += nodeLength;
      }
      
      if (targetNode && targetNode.nodeType === Node.TEXT_NODE) {
        // Split the text node and remove the @query part
        const textNode = targetNode as Text;
        const queryLength = 1 + mentionQuery.length; // @ + query
        
        // Split at query start
        const beforeText = textNode.textContent?.substring(0, targetOffset) || '';
        const afterText = textNode.textContent?.substring(targetOffset + queryLength) || '';
        
        // Replace the text node content
        textNode.textContent = beforeText;
        
        // Insert the pill after the text node
        if (textNode.parentNode) {
          textNode.parentNode.insertBefore(pill, textNode.nextSibling);
          
          // Add remaining text if any
          if (afterText) {
            const afterTextNode = document.createTextNode(afterText);
            textNode.parentNode.insertBefore(afterTextNode, pill.nextSibling);
          }
        }
        
        // Position cursor after pill
        const range = document.createRange();
        range.setStartAfter(pill);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Reset mention state
    setShowMentionMenu(false);
    setMentionQuery('');
    setSelectedMentionIndex(0);
    setMentionStartPos(0);
    setContent(editable.textContent || '');
    editable.focus();
  };

  // Insert agent as inline pill at cursor position
  const insertAgent = (agent: Agent) => {
    const editable = editableRef.current;
    if (!editable) return;
    
    // Create pill element
    const pill = document.createElement('span');
    pill.className = 'inline-flex items-center gap-1 px-2 py-1 bg-[#efe8ff] border border-[#c7bfe0] text-[#211534] rounded-md text-xs font-medium mx-1';
    pill.contentEditable = 'false';
    pill.setAttribute('data-agent', agent.name);
    
    const agentText = document.createElement('span');
    agentText.textContent = agent.name;
    pill.appendChild(agentText);
    
    // Add remove button that appears on hover
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'ml-1 text-slate-500 hover:text-slate-700 leading-none opacity-0 group-hover:opacity-100';
    removeBtn.onclick = () => removeAgent(agent);
    pill.appendChild(removeBtn);
    pill.className += ' group';
    
    // Insert at current cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(pill);
      
      // Move cursor after the pill
      range.setStartAfter(pill);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Add to selected agents list
    if (!selectedAgents.some(a => a.name === agent.name)) {
      setSelectedAgents(prev => [...prev, agent]);
    }
    
    editable.focus();
  };

  // Handle agent removal
  const removeAgent = (agentToRemove: Agent) => {
    setSelectedAgents(prev => prev.filter(a => a.name !== agentToRemove.name));
    
    // Remove pill from contentEditable
    const pill = editableRef.current?.querySelector(`[data-agent="${agentToRemove.name}"]`);
    if (pill) {
      pill.remove();
    }
    
    editableRef.current?.focus();
  };

  // Get text content excluding pills
  const getTextContentExcludingPills = () => {
    if (!editableRef.current) return '';
    
    let text = '';
    const walker = document.createTreeWalker(
      editableRef.current,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip text inside pill elements
          let parent = node.parentNode;
          while (parent && parent !== editableRef.current) {
            if ((parent as HTMLElement).hasAttribute?.('data-agent')) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentNode;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      text += node.textContent || '';
    }
    
  return text;
  };
  
  // Get clean message content for sending (including pill names but excluding remove buttons)
  const getCleanMessageContent = () => {
    if (!editableRef.current) return '';
    
    let content = '';
    const walker = document.createTreeWalker(
      editableRef.current,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // Skip text nodes that are inside pill elements
          if (node.nodeType === Node.TEXT_NODE) {
            let parent = node.parentNode;
            while (parent && parent !== editableRef.current) {
              if ((parent as HTMLElement).hasAttribute?.('data-agent')) {
                return NodeFilter.FILTER_REJECT; // Skip text inside pills
              }
              parent = parent.parentNode;
            }
            return NodeFilter.FILTER_ACCEPT; // Include regular text
          }
          
          // Include pill elements but exclude remove buttons
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.hasAttribute('data-agent')) {
              return NodeFilter.FILTER_ACCEPT; // Include pill
            }
            if (element.tagName === 'BUTTON') {
              return NodeFilter.FILTER_REJECT; // Exclude remove buttons
            }
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        content += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).hasAttribute('data-agent')) {
        // For pill elements, get the agent name
        const agentName = (node as HTMLElement).getAttribute('data-agent');
        if (agentName) {
          content += agentName;
        }
      }
    }
    
    return content;
  };
  
  // Get cursor position relative to text content (excluding pills)
  const getCursorPositionExcludingPills = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    
    // If cursor is in a pill, don't count it
    let parent = container.parentNode;
    while (parent && parent !== editableRef.current) {
      if ((parent as HTMLElement).hasAttribute?.('data-agent')) {
        return 0; // Cursor is inside a pill, treat as position 0 for mention detection
      }
      parent = parent.parentNode;
    }
    
    // Count text before cursor, excluding pills
    let cursorPos = 0;
    const walker = document.createTreeWalker(
      editableRef.current!,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip text inside pill elements
          let parent = node.parentNode;
          while (parent && parent !== editableRef.current) {
            if ((parent as HTMLElement).hasAttribute?.('data-agent')) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentNode;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node === container) {
        cursorPos += range.startOffset;
        break;
      } else {
        cursorPos += node.textContent?.length || 0;
      }
    }
    
    return cursorPos;
  };

  // Handle content changes
  const handleContentChange = () => {
    if (editableRef.current && !isNavigatingMention) {
      // Get text content excluding pills for mention detection
      const textContent = getTextContentExcludingPills();
      const fullContent = editableRef.current.textContent || '';
      
      setContent(fullContent); // Keep full content for display purposes
      
      console.log('Content changed to:', JSON.stringify(fullContent));
      
      // Detect @ mentions - use text excluding pills
      // Use longer delay if mention menu is open to prevent interference with navigation
      setTimeout(() => {
        if (!isNavigatingMention) { // Double check
          const cursorPos = getCursorPositionExcludingPills();
          console.log('Cursor position:', cursorPos, 'Content length:', textContent.length);
          detectMention(textContent, cursorPos);
        }
      }, showMentionMenu ? 50 : 10); // Longer delay when menu is open
    } else if (isNavigatingMention) {
      console.log('Skipping content change during arrow navigation');
    }
  };

  // Handle keyboard events for mention menu and general editing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention menu navigation
    if (showMentionMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setIsNavigatingMention(true);
        setSelectedMentionIndex(prev => {
          const newIndex = (prev + 1) % filteredAgents.length;
          console.log('Arrow down: prev =', prev, 'new =', newIndex, 'total =', filteredAgents.length);
          return newIndex;
        });
        // Clear navigation flag after a delay
        setTimeout(() => setIsNavigatingMention(false), 100);
        return; // Don't process any other events
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setIsNavigatingMention(true);
        setSelectedMentionIndex(prev => {
          const newIndex = (prev - 1 + filteredAgents.length) % filteredAgents.length;
          console.log('Arrow up: prev =', prev, 'new =', newIndex, 'total =', filteredAgents.length);
          return newIndex;
        });
        // Clear navigation flag after a delay
        setTimeout(() => setIsNavigatingMention(false), 100);
        return; // Don't process any other events
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (filteredAgents[selectedMentionIndex]) {
          insertMentionAgent(filteredAgents[selectedMentionIndex]);
        }
        return; // Don't process any other events
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        // Reset all mention state
        setShowMentionMenu(false);
        setMentionQuery('');
        setSelectedMentionIndex(0);
        setMentionStartPos(0);
        return; // Don't process any other events
      }
      // For other keys during mention, let them through but don't do other processing
      return;
    }
    
    // Handle Enter key for sending messages
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get clean message content (excluding pill remove buttons)
      const messageContent = getCleanMessageContent();
      if ((messageContent.trim() || pendingAttachments.length > 0) && onSendMessage) {
        onSendMessage(messageContent.trim(), pendingAttachments.length > 0 ? pendingAttachments : undefined);
        
        // Clear the input and attachments
        if (editableRef.current) {
          editableRef.current.innerHTML = '';
          setContent('');
          setSelectedAgents([]);
          setPendingAttachments([]);
        }
      }
      return;
    }
    
    // Handle regular key events
    if (e.key === 'Backspace') {
      // Check if we're deleting a pill
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const previousNode = range.startContainer.previousSibling;
        if (previousNode && (previousNode as HTMLElement).hasAttribute?.('data-agent')) {
          const agentName = (previousNode as HTMLElement).getAttribute('data-agent');
          const agent = selectedAgents.find(a => a.name === agentName);
          if (agent) {
            removeAgent(agent);
            e.preventDefault();
          }
        }
      }
    }
  };

  // Expose functions globally so parent can call them
  React.useEffect(() => {
    (window as any).__insertAgent = insertAgent;
    (window as any).__saveCursorPosition = saveCursorPosition;
    (window as any).__addAttachment = (attachment: { type: 'scenario' }) => {
      setPendingAttachments(prev => [...prev, attachment]);
      // Focus the input
      if (editableRef.current) {
        editableRef.current.focus();
      }
    };
  }, [content, selectedAgents, savedCursorPosition]);

  // Calculate if we need multiline
  const needsMultiline = content.length > 50 || selectedAgents.length > 3;
  const showPlaceholder = !content && selectedAgents.length === 0;
  
  return (
    <div className="flex-1 min-w-[120px] relative">
      <div className={cls(
        "px-3 pt-2 pb-1 bg-white border border-slate-200 rounded-lg focus-within:border-[#513295] focus-within:ring-1 focus-within:ring-[#513295]/20 transition-all duration-200",
        needsMultiline ? "min-h-[72px]" : "min-h-[60px]" // Increased min height for buttons
      )}>
        {showPlaceholder && (
          <div className="absolute inset-3 text-slate-400 pointer-events-none text-sm">
            {placeholder || "Ask anything..."}
          </div>
        )}
        <div
          ref={editableRef}
          contentEditable
          onInput={handleContentChange}
          onChange={handleContentChange as any}
          onKeyDown={handleKeyDown}
          className="outline-none text-sm min-h-[20px] leading-relaxed relative z-10 mb-2"
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            backgroundColor: 'transparent'
          }}
          suppressContentEditableWarning={true}
        />
        
        {/* Pending Attachments */}
        {pendingAttachments.length > 0 && (
          <div className="mb-3 flex gap-2">
            {pendingAttachments.map((attachment, index) => {
              if (attachment.type === 'scenario') {
                return (
                  <div key={index} className="relative">
                    <div className="scale-75 origin-top-left">
                      <ScenarioCard />
                    </div>
                    <button 
                      onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-slate-500 hover:bg-slate-600 text-white rounded-full flex items-center justify-center text-xs"
                      aria-label="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
        
        {/* Action buttons row */}
        <div className="flex items-center gap-2 mt-1">
          {/* Add Menu */}
          <div className="relative" ref={addMenuRef}>
            <button 
              onClick={() => setAddMenuOpen(!addMenuOpen)} 
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              aria-label="Add content"
            >
+
            </button>
            {addMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white border rounded shadow-lg text-sm min-w-[200px] z-50">
                <div className="relative">
                  <button 
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100"
                    onMouseEnter={() => setUploadSubmenuOpen(true)}
                    onMouseLeave={() => setUploadSubmenuOpen(false)}
                  >
                    Upload
                    <span>→</span>
                  </button>
                  {uploadSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-white border rounded shadow-lg text-sm min-w-[150px]">
                      <button className="block w-full text-left px-4 py-2 hover:bg-slate-100">File</button>
                      <button className="block w-full text-left px-4 py-2 hover:bg-slate-100">Photo</button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => { onOpenScenario(); setAddMenuOpen(false); }} 
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100"
                >
                  Scenario Planner…
                </button>
              </div>
            )}
          </div>
          
          {/* Agents Menu */}
          <div className="relative" ref={agentsMenuRef}>
            <button 
              onClick={() => {
                // Save cursor position before opening menu
                if ((window as any).__saveCursorPosition) {
                  (window as any).__saveCursorPosition();
                }
                setAgentsMenuOpen(!agentsMenuOpen);
                if (!agentsMenuOpen) {
                  setSelectedAgentIndex(0); // Reset selection when opening
                }
              }} 
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold" 
              aria-label="Mention agents"
            >
              @
            </button>
            {agentsMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white border rounded shadow-lg text-sm min-w-[320px] max-w-[400px] z-50">
                <div className="max-h-[300px] overflow-y-auto">
                  {AGENTS.map((agent, idx) => (
                    <button
                      key={agent.name}
                      data-agent-index={idx}
                      className={cls(
                        "w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0",
                        idx === selectedAgentIndex && "bg-slate-100"
                      )}
                      onClick={() => handleAgentSelect(agent)}
                      onMouseEnter={() => setSelectedAgentIndex(idx)}
                    >
                      <div className="font-semibold text-[13px] text-slate-900 mb-1">
                        {agent.name}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {agent.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mention Menu */}
      {showMentionMenu && filteredAgents.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border rounded shadow-lg text-sm min-w-[320px] max-w-[400px] z-50">
          <div ref={mentionMenuRef} className="max-h-[300px] overflow-y-auto">
            {filteredAgents.map((agent, idx) => (
              <button
                key={agent.name}
                data-agent-index={idx}
                className={cls(
                  "w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0",
                  idx === selectedMentionIndex && "bg-slate-100"
                )}
                onClick={() => insertMentionAgent(agent)}
                onMouseEnter={() => setSelectedMentionIndex(idx)}
              >
                <div className="font-semibold text-[13px] text-slate-900 mb-1">
                  {agent.name}
                  {agent.acronyms && agent.acronyms.length > 0 && (
                    <span className="text-slate-500 font-normal ml-2">({agent.acronyms.join(", ")})</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {agent.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Ask Harmony Box Component with Interactive Responses
const AskHarmonyBox: React.FC<{ onResponseChange?: (response: any) => void }> = ({ onResponseChange }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseType, setResponseType] = useState<'text' | 'chart' | 'table' | null>(null);
  const [selectedModality, setSelectedModality] = useState<'text' | 'chart' | 'table'>('text');
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sample questions with their default modality types
  const sampleQuestions = [
    { text: "What are the project risks?", defaultType: 'text' as const },
    { text: "Show me the budget analysis", defaultType: 'chart' as const },
    { text: "Display project tasks", defaultType: 'table' as const },
    { text: "How is the timeline looking?", defaultType: 'text' as const },
    { text: "What about resource allocation?", defaultType: 'chart' as const }
  ];
  
  // Close help menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelp(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleQuestionSelect = (questionText: string, defaultType: 'text' | 'chart' | 'table') => {
    setQuestion(questionText);
    setSelectedModality(defaultType);
    setShowHelp(false);
    
    // Focus textarea and position cursor at the end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = questionText.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };
  
  const handleModalityChange = (newModality: 'text' | 'chart' | 'table') => {
    setSelectedModality(newModality);
    if (response) {
      // Re-generate response with new modality
      generateMockResponse(newModality);
    }
  };
  
  const generateMockResponse = (type: 'text' | 'chart' | 'table') => {
    let mockResponse;
    
    // Generate different content based on the current question context
    const isRiskQuestion = question.toLowerCase().includes('risk');
    const isBudgetQuestion = question.toLowerCase().includes('budget');
    const isTaskQuestion = question.toLowerCase().includes('task');
    const isTimelineQuestion = question.toLowerCase().includes('timeline');
    const isResourceQuestion = question.toLowerCase().includes('resource');
    
    switch (type) {
      case 'text':
        if (isRiskQuestion) {
          mockResponse = {
            content: "**High Risk Areas:**\n• **Equipment Delays**: 4-6 week potential delay\n• **Budget Overrun**: 12% over planned costs\n• **Resource Constraints**: Team at 95% capacity\n\n**Mitigation Strategies:**\n• Diversify supplier base\n• Accelerate procurement timeline\n• Phase project delivery"
          };
        } else if (isBudgetQuestion) {
          mockResponse = {
            content: "**Budget Status:**\n• **Equipment**: $4.1M spent vs $3.8M planned\n• **Personnel**: $980k spent vs $1.2M planned\n• **Materials**: $920k spent vs $800k planned\n\n**Overall**: Tracking 8% over budget with equipment overruns offset by personnel savings."
          };
        } else {
          mockResponse = {
            content: "**Project Overview:**\n• **Timeline**: On track for Q2 delivery\n• **Progress**: 65% complete overall\n• **Key Focus**: Equipment procurement and testing\n\n**Next Steps:**\n• Complete site preparation\n• Begin quality testing phase\n• Finalize training materials"
          };
        }
        break;
        
      case 'chart':
        if (isRiskQuestion) {
          mockResponse = {
            chartType: 'risk',
            data: [
              { category: 'Equipment Delays', level: 85, impact: 'High' },
              { category: 'Budget Overrun', level: 70, impact: 'Medium' },
              { category: 'Resource Constraints', level: 60, impact: 'Medium' },
              { category: 'Quality Issues', level: 25, impact: 'Low' },
              { category: 'Schedule Slip', level: 45, impact: 'Medium' }
            ]
          };
        } else {
          mockResponse = {
            chartType: 'budget',
            data: [
              { category: 'Equipment', budget: 3800000, actual: 4100000 },
              { category: 'Personnel', budget: 1200000, actual: 980000 },
              { category: 'Materials', budget: 800000, actual: 920000 },
              { category: 'Training', budget: 400000, actual: 350000 },
              { category: 'Contingency', budget: 300000, actual: 50000 }
            ]
          };
        }
        break;
        
      case 'table':
        if (isRiskQuestion) {
          mockResponse = {
            columns: ['Risk', 'Probability', 'Impact', 'Owner', 'Mitigation'],
            rows: [
              ['Equipment Delays', 'High', 'High', 'Sarah Chen', 'Supplier diversification'],
              ['Budget Overrun', 'Medium', 'High', 'Finance Team', 'Weekly cost reviews'],
              ['Resource Constraints', 'Medium', 'Medium', 'PMO', 'Cross-training staff'],
              ['Quality Issues', 'Low', 'High', 'QA Team', 'Enhanced testing'],
              ['Schedule Slip', 'Medium', 'Medium', 'Project Lead', 'Buffer time added']
            ]
          };
        } else if (isBudgetQuestion) {
          mockResponse = {
            columns: ['Category', 'Planned Budget', 'Actual Spend', 'Variance', 'Status'],
            rows: [
              ['Equipment', '$3.8M', '$4.1M', '+$300k', 'Over Budget'],
              ['Personnel', '$1.2M', '$980k', '-$220k', 'Under Budget'],
              ['Materials', '$800k', '$920k', '+$120k', 'Over Budget'],
              ['Training', '$400k', '$350k', '-$50k', 'Under Budget'],
              ['Contingency', '$300k', '$50k', '-$250k', 'Available']
            ]
          };
        } else if (isTaskQuestion) {
          mockResponse = {
            columns: ['Task', 'Owner', 'Status', 'Due Date', 'Progress'],
            rows: [
              ['Equipment Procurement', 'Sarah Chen', 'In Progress', '2025-02-15', '75%'],
              ['Site Preparation', 'Mike Rodriguez', 'Completed', '2025-01-30', '100%'],
              ['Training Materials', 'Lisa Park', 'Planning', '2025-03-01', '25%'],
              ['Quality Testing', 'David Kim', 'Not Started', '2025-03-15', '0%'],
              ['Go-Live Preparation', 'Jennifer Wu', 'Not Started', '2025-04-01', '0%']
            ]
          };
        } else if (isTimelineQuestion) {
          mockResponse = {
            columns: ['Milestone', 'Planned Date', 'Actual Date', 'Status', 'Dependencies'],
            rows: [
              ['Design Complete', '2025-01-15', '2025-01-12', 'Complete', 'None'],
              ['Equipment Order', '2025-01-30', '2025-02-05', 'Delayed', 'Supplier approval'],
              ['Site Prep Done', '2025-02-28', '2025-02-20', 'Early', 'Design complete'],
              ['Installation Start', '2025-03-15', 'TBD', 'Pending', 'Equipment delivery'],
              ['Go-Live', '2025-04-30', 'TBD', 'At Risk', 'All prior milestones']
            ]
          };
        } else if (isResourceQuestion) {
          mockResponse = {
            columns: ['Resource', 'Allocated', 'Current Usage', 'Availability', 'Next Available'],
            rows: [
              ['Project Manager', '100%', '95%', '5%', 'Immediately'],
              ['Technical Lead', '100%', '85%', '15%', 'Feb 1st'],
              ['Engineers', '80%', '95%', 'Overallocated', 'Mar 15th'],
              ['QA Specialist', '60%', '40%', '60%', 'Immediately'],
              ['Training Coord', '40%', '25%', '75%', 'Immediately']
            ]
          };
        } else {
          // Default general project overview table
          mockResponse = {
            columns: ['Area', 'Status', 'Progress', 'Owner', 'Next Action'],
            rows: [
              ['Planning', 'Complete', '100%', 'PMO', 'Monitor execution'],
              ['Procurement', 'In Progress', '75%', 'Sarah Chen', 'Finalize orders'],
              ['Development', 'Active', '65%', 'Tech Team', 'Continue coding'],
              ['Testing', 'Pending', '10%', 'QA Team', 'Prepare test cases'],
              ['Deployment', 'Not Started', '0%', 'Ops Team', 'Plan rollout']
            ]
          };
        }
        break;
    }
    setResponseType(type);
    setResponse(mockResponse);
    onResponseChange?.(mockResponse);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setIsLoading(true);
    setResponse(null);
    setResponseType(selectedModality);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate mock response using selected modality
    generateMockResponse(selectedModality);
    setIsLoading(false);
  };
  
  const handleReset = () => {
    setQuestion('');
    setResponse(null);
    setResponseType(null);
    setIsLoading(false);
  };
  
  return (
    <div className="h-full max-h-full flex flex-col overflow-visible">
      {!isLoading && !response ? (
        // Initial state
        <>
          <div className="flex items-start gap-3 mb-4">
            <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony AI" className="w-8 h-8 mt-1" />
            <div className="text-sm text-slate-600 flex-1">
              Get instant insights and recommendations about this project from Harmony AI.
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask about project risks, timeline, budget..."
                  className="w-full h-20 p-3 border border-slate-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Suggested Questions */}
              <div className="mt-3">
                <div className="text-xs font-medium text-slate-600 mb-2">Suggested questions</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuestionSelect(q.text, q.defaultType)}
                      className="w-full text-left p-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between"
                    >
                      <span className="flex-1 leading-relaxed">{q.text}</span>
                      <span className="ml-2 text-sm font-medium">
                        {q.defaultType === 'chart' ? '╱╱' : q.defaultType === 'table' ? '≡' : 'A'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </>
      ) : isLoading ? (
        // Loading state
        <div className="h-full flex flex-col items-center justify-center">
          <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony AI" className="w-12 h-12 mb-4 animate-pulse" />
          <div className="text-center">
            <div className="text-sm font-medium text-slate-700 mb-2">Analyzing project data...</div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      ) : (
        // Response state
        <div className="h-full flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony AI" className="w-8 h-8 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium text-slate-700">Response to: "{question}"</div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => handleModalityChange('text')}
                    className={cls(
                      "w-8 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center",
                      selectedModality === 'text' 
                        ? "bg-white text-slate-800 shadow-sm" 
                        : "text-slate-600 hover:text-slate-800"
                    )}
                    title="Text response"
                  >
                    A
                  </button>
                  <button
                    onClick={() => handleModalityChange('chart')}
                    className={cls(
                      "w-8 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center",
                      selectedModality === 'chart' 
                        ? "bg-white text-slate-800 shadow-sm" 
                        : "text-slate-600 hover:text-slate-800"
                    )}
                    title="Chart response"
                  >
                    ╱╱
                  </button>
                  <button
                    onClick={() => handleModalityChange('table')}
                    className={cls(
                      "w-8 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center",
                      selectedModality === 'table' 
                        ? "bg-white text-slate-800 shadow-sm" 
                        : "text-slate-600 hover:text-slate-800"
                    )}
                    title="Table response"
                  >
                    ≡
                  </button>
                </div>
              </div>
              <button onClick={handleReset} className="text-xs text-purple-600 hover:text-purple-800">Ask another question</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedModality === 'text' && (
              <div className="text-sm text-slate-700 leading-relaxed space-y-3">
                {response.content.split('\n\n').map((paragraph: string, idx: number) => (
                  <div key={idx}>
                    {paragraph.split('\n').map((line: string, lineIdx: number) => {
                      // Handle bold markdown **text**
                      const parts = line.split(/\*\*(.*?)\*\*/);
                      return (
                        <div key={lineIdx} className={lineIdx > 0 ? 'mt-1' : ''}>
                          {parts.map((part: string, partIdx: number) => 
                            partIdx % 2 === 1 ? (
                              <strong key={partIdx} className="font-semibold text-slate-800">{part}</strong>
                            ) : (
                              <span key={partIdx}>{part}</span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
            
            {selectedModality === 'chart' && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-slate-700">
                  {response.chartType === 'risk' ? 'Risk Levels by Category' : 'Budget vs Actual by Category'}
                </div>
                <div className="space-y-2">
                  {response.data.map((item: any) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-slate-500">
                          {response.chartType === 'risk' 
                            ? `${item.level}% - ${item.impact} Impact`
                            : `$${(item.actual / 1000000).toFixed(1)}M / $${(item.budget / 1000000).toFixed(1)}M`
                          }
                        </span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded overflow-hidden relative">
                        {response.chartType === 'risk' ? (
                          <div 
                            className={`h-full absolute ${
                              item.level > 70 ? 'bg-red-500' :
                              item.level > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${item.level}%` }}
                          />
                        ) : (
                          <>
                            <div 
                              className="h-full bg-slate-300 absolute" 
                              style={{ width: `${(item.budget / 5000000) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-purple-600 absolute" 
                              style={{ width: `${(item.actual / 5000000) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {response.chartType !== 'risk' && (
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-slate-300 rounded"></div>
                      <span>Budget</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-600 rounded"></div>
                      <span>Actual</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {selectedModality === 'table' && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">
                  {(() => {
                    const q = question.toLowerCase();
                    if (q.includes('risk')) return 'Risk Assessment Matrix';
                    if (q.includes('budget')) return 'Budget Analysis Breakdown';
                    if (q.includes('task')) return 'Project Tasks Overview';
                    if (q.includes('timeline')) return 'Project Milestone Timeline';
                    if (q.includes('resource')) return 'Resource Allocation Overview';
                    return 'Project Status Overview';
                  })()
                  }
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50">
                        {response.columns.map((col: string) => (
                          <th key={col} className="text-left p-2 font-medium text-slate-700 border-b">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {response.rows.map((row: string[], idx: number) => (
                        <tr key={idx} className="border-b hover:bg-slate-25">
                          {row.map((cell: string, cellIdx: number) => (
                            <td key={cellIdx} className="p-2 text-slate-600">
                              {cellIdx === 2 ? ( // Status column
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  cell === 'Completed' ? 'bg-green-100 text-green-800' :
                                  cell === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  cell === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {cell}
                                </span>
                              ) : cellIdx === 4 ? ( // Progress column
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-2 bg-slate-200 rounded overflow-hidden">
                                    <div 
                                      className="h-full bg-purple-600" 
                                      style={{ width: cell }}
                                    />
                                  </div>
                                  <span className="text-xs">{cell}</span>
                                </div>
                              ) : (
                                cell
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component to handle the widget menu functionality
const AskHarmonyBoxWithMenu: React.FC = () => {
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const widgetMenuRef = useRef<HTMLDivElement>(null);
  const [response, setResponse] = useState<any>(null);
  
  // Close widget menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetMenuRef.current && !widgetMenuRef.current.contains(event.target as Node)) {
        setShowWidgetMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <Card 
      title="Ask Harmony" 
      className="h-full flex flex-col overflow-visible"
      onMenuClick={() => setShowWidgetMenu(!showWidgetMenu)}
      showMenu={showWidgetMenu}
      menuRef={widgetMenuRef}
      menuContent={
        <div className="py-1 min-w-[240px]">
          <button
            onClick={() => {
              if (!response) return;
              console.log('Save answer as widget clicked');
              setShowWidgetMenu(false);
            }}
            disabled={!response}
            className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 ${
              response 
                ? 'hover:bg-slate-50 text-slate-700 cursor-pointer' 
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className={response ? '' : 'opacity-50'}>💾</span>
            Save answer as widget...
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={() => {
              if (!response) return;
              setShowWidgetMenu(false);
              const widgetInfo = {
                name: 'Ask Harmony',
                type: 'widget',
                data: JSON.stringify(response)
              };
              window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
            }}
            disabled={!response}
            className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 ${
              response 
                ? 'hover:bg-slate-50 text-slate-700 cursor-pointer' 
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <img 
              src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" 
              alt="Harmony" 
              className={`w-4 h-4 ${response ? '' : 'opacity-50'}`}
            />
            Chat with Harmony...
          </button>
        </div>
      }
    >
      <div className="flex-1 min-h-0 overflow-visible">
        <AskHarmonyBox onResponseChange={setResponse} />
      </div>
    </Card>
  );
};

// Activity Feed Widget Component
const ActivityFeedWidget: React.FC = () => {
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([
    // Conductor activity types
    'task-update', 'kpi-update', 'project-change', 'approval-request', 'milestone-update',
    // External activity types  
    'deal-update', 'file-change', 'message', 'story-update', 'meeting-scheduled',
    // Signal types
    'market-data', 'industry-news', 'regulatory-update', 'harmony-briefing'
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'conductor', 'salesforce', 'teams', 'jira', 'sharepoint', 'dealcloud', 
    'smartsheet', 'planview', 'msproject', 'harmony'
  ]);
  const [selectedInsightTypes, setSelectedInsightTypes] = useState<string[]>([
    'market_trend', 'competitor_activity', 'customer_behavior', 'risk_alert', 'opportunity', 'harmony_briefing'
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [activities, setActivities] = useState<Array<any>>([]);
  const [nextActivityIndex, setNextActivityIndex] = useState(0);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [showBriefingsModal, setShowBriefingsModal] = useState(false);
  const [showBriefingViewer, setShowBriefingViewer] = useState(false);
  const [selectedBriefingContent, setSelectedBriefingContent] = useState('');
  const [selectedBriefingTitle, setSelectedBriefingTitle] = useState('');
  const [openActivityMenu, setOpenActivityMenu] = useState<string | null>(null);
  
  // Briefings management state
  const [briefingsList, setBriefingsList] = useState<Array<{
    id: string;
    name: string;
    frequency: string;
    day: string;
    time: string;
    deliveryMethods: string[];
  }>>([{
    id: '1',
    name: 'Executive Briefing',
    frequency: 'Weekly',
    day: 'Monday',
    time: '09:00',
    deliveryMethods: ['Activity Feed']
  }]);
  const [selectedBriefingId, setSelectedBriefingId] = useState<string | null>(null);
  const [briefingSearch, setBriefingSearch] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState('');
  const [briefingFrequency, setBriefingFrequency] = useState('Weekly');
  const [briefingDay, setBriefingDay] = useState('Monday');
  const [briefingTime, setBriefingTime] = useState('09:00');
  const [briefingDelivery, setBriefingDelivery] = useState<string[]>(['Activity Feed']);
  
  // Reset day field when frequency changes
  useEffect(() => {
    if (briefingFrequency === 'Daily') {
      setBriefingDay('Every Day');
    } else if (briefingFrequency === 'Weekly' && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(briefingDay)) {
      setBriefingDay('Monday');
    } else if (briefingFrequency === 'Monthly' && !briefingDay.includes('First') && !briefingDay.includes('Last') && !briefingDay.includes('of month')) {
      setBriefingDay('First Monday');
    }
  }, [briefingFrequency, briefingDay]);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const widgetMenuRef = useRef<HTMLDivElement>(null);
  const briefingsModalRef = useRef<HTMLDivElement>(null);
  const briefingViewerRef = useRef<HTMLDivElement>(null);
  
  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideFilter = filtersRef.current && filtersRef.current.contains(target);
      const isClickOnButton = filterButtonRef.current && filterButtonRef.current.contains(target);
      
      if (!isClickInsideFilter && !isClickOnButton) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close widget menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetMenuRef.current && !widgetMenuRef.current.contains(event.target as Node)) {
        setShowWidgetMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close activity row menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close if clicking outside any activity menu
      if (!target.closest('.relative')) {
        setOpenActivityMenu(null);
      }
    };
    if (openActivityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openActivityMenu]);

  // Handle escape key and outside clicks for config modal
  useEffect(() => {
    if (!showConfigModal) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowConfigModal(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('modal-overlay')) {
        setShowConfigModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfigModal]);

  // Handle escape key and outside clicks for Briefings modal
  useEffect(() => {
    if (!showBriefingsModal) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBriefingsModal(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('briefings-modal-overlay')) {
        setShowBriefingsModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBriefingsModal]);

  // Handle escape key and outside clicks for Briefing Viewer modal
  useEffect(() => {
    if (!showBriefingViewer) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBriefingViewer(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('briefing-viewer-overlay')) {
        setShowBriefingViewer(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBriefingViewer]);
  
  // Activity type and platform definitions
  const activityTypeLabels = {
    // Conductor types
    'task-update': 'Task Updates',
    'kpi-update': 'KPI Changes', 
    'project-change': 'Project Changes',
    'approval-request': 'Approval Requests',
    'milestone-update': 'Milestone Updates',
    // External types
    'deal-update': 'Deal Updates',
    'file-change': 'File Changes', 
    'message': 'Messages',
    'story-update': 'Story Updates',
    'meeting-scheduled': 'Meeting Scheduled',
    // Signal types
    'market-data': 'Market Signals',
    'industry-news': 'Industry News',
    'regulatory-update': 'Regulatory Updates',
    'harmony-briefing': 'Harmony Briefings'
  };
  
  const platformLabels = {
    'conductor': 'Conductor',
    'salesforce': 'Salesforce',
    'teams': 'Microsoft Teams',
    'jira': 'Jira',
    'sharepoint': 'SharePoint', 
    'dealcloud': 'DealCloud',
    'smartsheet': 'Smartsheet',
    'planview': 'Planview',
    'msproject': 'Microsoft Project',
    'harmony': 'Harmony Insights'
  };

  const insightTypeLabels = {
    'market_trend': 'Market Trends',
    'competitor_activity': 'Competitor Activity', 
    'customer_behavior': 'Customer Behavior',
    'risk_alert': 'Risk Alerts',
    'opportunity': 'Opportunities',
    'harmony_briefing': 'Harmony Briefings'
  };

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };
  
  // Pool of activities to cycle through
  const activityPool = [
    {
      activityType: 'task-update',
      platform: 'conductor',
      icon: '/images/conductor.png',
      action: 'Task completed',
      details: 'Market research phase completed ahead of schedule',
      user: 'Sarah Chen',
      link: 'https://conductor.harmony.com/tasks/124'
    },
    {
      activityType: 'market-data',
      platform: 'harmony',
      insightType: 'market_trend',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Market trend alert',
      details: 'Raw material costs showing downward trend - potential cost savings opportunity',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/signals/market-124'
    },
    {
      activityType: 'deal-update',
      platform: 'salesforce',
      icon: '/images/salesforce.png',
      action: 'New lead created',
      details: 'Enterprise client GlobalTech showing interest in manufacturing solutions',
      user: 'Mike Rodriguez',
      link: 'https://salesforce.com/lead/789012'
    },
    {
      activityType: 'message',
      platform: 'teams',
      icon: '/images/teams.png',
      action: 'Meeting scheduled',
      details: 'Weekly manufacturing review - Friday 2:00 PM',
      user: 'Lisa Park',
      link: 'https://teams.microsoft.com/meeting/manufacturing-review-456'
    },
    {
      activityType: 'kpi-update',
      platform: 'conductor',
      icon: '/images/conductor.png',
      action: 'KPI milestone reached',
      details: 'Production efficiency hit 87% - exceeding target by 2%',
      user: 'PMO Team',
      link: 'https://conductor.harmony.com/kpis/production-efficiency'
    },
    {
      activityType: 'story-update',
      platform: 'jira',
      icon: '/images/jira.png',
      action: 'Bug resolved',
      details: 'MFG-456: Inventory sync issue resolved and deployed',
      user: 'David Kim',
      link: 'https://company.atlassian.net/browse/MFG-456'
    },
    {
      activityType: 'industry-news',
      platform: 'harmony',
      insightType: 'competitor_activity',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Competitor update',
      details: 'Competitor ABC Inc announced 15% price reduction on similar products',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/intelligence/abc-pricing-789'
    },
    {
      activityType: 'file-change',
      platform: 'sharepoint',
      icon: '/images/sharepoint.png',
      action: 'Document published',
      details: 'Q1 Manufacturing Report finalized and published',
      user: 'Jennifer Wu',
      link: 'https://company.sharepoint.com/sites/manufacturing/q1-report.pdf'
    },
    {
      activityType: 'approval-request',
      platform: 'conductor',
      icon: '/images/conductor.png',
      action: 'Approval granted',
      details: 'Equipment upgrade budget approved - $250k allocated',
      user: 'Finance Team',
      link: 'https://conductor.harmony.com/approvals/equipment-upgrade'
    },
    {
      activityType: 'deal-update',
      platform: 'dealcloud',
      icon: '/images/dealcloud.png',
      action: 'Contract signed',
      details: 'Steel supplier contract renewed for 2025 - 5% cost reduction',
      user: 'Alex Thompson',
      link: 'https://dealcloud.com/contracts/steel-supplier-2025'
    },
    {
      activityType: 'regulatory-update',
      platform: 'harmony',
      insightType: 'risk_alert',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Compliance update',
      details: 'New safety regulations published - implementation deadline March 2025',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/regulatory/safety-2025'
    },
    {
      activityType: 'file-change',
      platform: 'smartsheet',
      icon: '/images/smartsheet.png',
      action: 'Schedule updated',
      details: 'Production line maintenance rescheduled to minimize downtime',
      user: 'Maria Garcia',
      link: 'https://smartsheet.com/schedules/maintenance-2025'
    },
    {
      activityType: 'message',
      platform: 'teams',
      icon: '/images/teams.png',
      action: 'Announcement posted',
      details: 'New quality standards implemented - training sessions scheduled',
      user: 'Quality Team',
      link: 'https://teams.microsoft.com/announcements/quality-standards'
    },
    {
      activityType: 'market-data',
      platform: 'harmony',
      insightType: 'opportunity',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Market opportunity',
      details: 'Growing demand in Southeast Asia market - 30% growth projected',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/opportunities/sea-market'
    },
    {
      activityType: 'task-update',
      platform: 'conductor',
      icon: '/images/conductor.png',
      action: 'Milestone achieved',
      details: 'Phase 2 testing completed successfully - moving to Phase 3',
      user: 'Engineering Team',
      link: 'https://conductor.harmony.com/milestones/phase-2'
    },
    {
      activityType: 'story-update',
      platform: 'jira',
      icon: '/images/jira.png',
      action: 'Feature deployed',
      details: 'MFG-789: Real-time inventory tracking now live in production',
      user: 'DevOps Team',
      link: 'https://company.atlassian.net/browse/MFG-789'
    },
    {
      activityType: 'industry-news',
      platform: 'harmony',
      insightType: 'customer_behavior',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Customer insight',
      details: 'Customer satisfaction scores up 12% following recent improvements',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/customer/satisfaction-q4'
    },
    {
      activityType: 'deal-update',
      platform: 'salesforce',
      icon: '/images/salesforce.png',
      action: 'Quote approved',
      details: 'MegaCorp project quote approved - $1.2M manufacturing contract',
      user: 'Sales Team',
      link: 'https://salesforce.com/quotes/megacorp-manufacturing'
    },
    {
      activityType: 'file-change',
      platform: 'sharepoint',
      icon: '/images/sharepoint.png',
      action: 'Policy updated',
      details: 'Manufacturing safety protocols updated with latest guidelines',
      user: 'Safety Team',
      link: 'https://company.sharepoint.com/policies/safety-protocols-v5'
    },
    {
      activityType: 'kpi-update',
      platform: 'conductor',
      icon: '/images/conductor.png',
      action: 'Performance alert',
      details: 'Energy efficiency improved by 8% this month - cost savings achieved',
      user: 'Operations Team',
      link: 'https://conductor.harmony.com/kpis/energy-efficiency'
    },
    {
      activityType: 'harmony-briefing',
      platform: 'harmony',
      insightType: 'harmony_briefing',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Harmony Briefing: Executive Briefing',
      details: 'Executive briefing delivered - Program performance analysis with action items and strategic recommendations',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/briefings/executive-briefing-2025',
      briefingType: 'Executive Briefing',
      briefingContent: `<div id="analysisContent" dir="ltr"><h1>Executive Summary</h1>
<p>Based on the analysis of the provided data for CompanyID=7, the overall program is <strong>not on track to meet its target</strong>. The total LBE for the program is $930.64 M, which is significantly higher than the target, indicating a negative variance. This suggests that the program is overspending compared to the initial targets. The percentage change in LBE from the previous year to the current year is <span style="color: red;">-26.49%</span>, which further highlights the need for immediate corrective actions.</p>
<h3>Key Outliers</h3>
<h4>Positive Outliers:</h4>
<ol>
<li><strong>Highest Performing KPI Element</strong>: The "Indirect BOM Savings" KPI element has achieved a performance of 1.0028, indicating it is slightly above target and contributing positively to the program.</li>
<li><strong>Top 5 Projects Positively Impacting the Program</strong>:<ul>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10515">📁 Cloud Migration</a>: <span style="color: green;">+$3.75 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10526">📁 Cost Optimization and Efficiency Improvement</a>: <span style="color: green;">+$2.50 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10292">📁 Agency management protocol C</a>: <span style="color: green;">+$2.96 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10517">📁 Cybersecurity Enhancement</a>: <span style="color: green;">+$1.00 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10288">📁 Outsource janitorial</a>: <span style="color: green;">+$0.70 M</span></li>
</ul>
</li>
</ol>
<h4>Negative Outliers:</h4>
<ol>
<li><p><strong>Projects Farthest Away from Targets</strong>:</p>
<ul>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10273">📁 3D print capabilities in each facility</a>: <span style="color: red;">-$4.00 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10514">📁 Online payment system</a>: <span style="color: red;">-$2.51 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10274">📁 Robotics upgrade on packaging line</a>: <span style="color: red;">-$2.00 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10288">📁 Outsource janitorial</a>: <span style="color: red;">-$1.23 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10515">📁 Cloud Migration</a>: <span style="color: red;">-$0.75 M</span></li>
</ul>
</li>
<li><p><strong>Projects Farthest Away from Targets (No Actuals Recorded)</strong>:</p>
<ul>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10292">📁 Agency management protocol C</a>: <span style="color: red;">-$0.75 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10278">📁 Digital Collaboration Platform for R&D Teams</a>: <span style="color: red;">-$0.15 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10514">📁 Online payment system</a>: <span style="color: red;">-$0.01 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10277">📁 Combine sales teams in US Midwest and central</a>: <span style="color: red;">-$0.00 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10276">📁 Realign sales commissions to OKRs</a>: <span style="color: red;">-$0.00 M</span></li>
</ul>
</li>
</ol>
<h4>Risks:</h4>
<ol>
<li><strong>Overall Program Performance</strong>: The program is not on track to meet its target, with a significant overspend indicated by the LBE exceeding the target.</li>
<li><strong>Critical Projects</strong>: Several high-priority projects are underperforming, with LBEs exceeding their targets:<ul>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10275">📁 Outsource shipping in urban centers</a>: <span style="color: red;">-$0.50 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10289">📁 Standardize SAP implementations across sub-co's</a>: <span style="color: red;">-$0.25 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10526">📁 Cost Optimization and Efficiency Improvement</a>: <span style="color: red;">-$1.00 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10290">📁 In-source video production</a>: <span style="color: red;">-$0.50 M</span></li>
</ul>
</li>
</ol>
<hr>
<h3>Action Items</h3>
<h4>Immediate Actions:</h4>
<ul>
<li><p><strong>Focus on Underperforming Projects</strong>:</p>
<ul>
<li>Review and address the negative variances for the following projects:<ul>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10273">📁 3D print capabilities in each facility</a>: <span style="color: red;">-$4.00 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10514">📁 Online payment system</a>: <span style="color: red;">-$2.51 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10274">📁 Robotics upgrade on packaging line</a>: <span style="color: red;">-$2.00 M</span></li>
</ul>
</li>
<li>Investigate the reasons for overspending and implement corrective measures.</li>
</ul>
</li>
<li><p><strong>Address Projects with No Actuals Recorded</strong>:</p>
<ul>
<li>Ensure accurate and timely reporting for projects with no actuals recorded:<ul>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10292">📁 Agency management protocol C</a>: <span style="color: red;">-$0.75 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10278">📁 Digital Collaboration Platform for R&D Teams</a>: <span style="color: red;">-$0.15 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10514">📁 Online payment system</a>: <span style="color: red;">-$0.01 M</span></li>
</ul>
</li>
</ul>
</li>
</ul>
<h4>Strategic Recommendations:</h4>
<ul>
<li><strong>Reassess Forecasts</strong>: Collaborate with project managers to update forecasts and ensure they align with realistic expectations. This will help improve the accuracy of LBEs and reduce variances.</li>
<li><strong>Optimize High-Cost Workstreams</strong>: The "Sales" workstream contributes the most to the overall LBE ($154.57 M). Conduct a detailed review to identify cost-saving opportunities.</li>
<li><strong>Monitor Quarterly Variances</strong>: Pay close attention to quarters with significant negative variances, such as Q3 2024 (<span style="color: red;">-$2.10 M</span>) and Q4 2024 (<span style="color: red;">-$3.40 M</span>). Implement cost control measures to mitigate risks in these periods.</li>
</ul>
<h4>Long-Term Actions:</h4>
<ul>
<li><strong>Enhance Reporting Processes</strong>: Implement stricter controls to ensure timely and accurate reporting of actuals across all projects.</li>
<li><strong>Prioritize High-Impact Projects</strong>: Allocate resources to projects with positive variances and high LBE contributions:<ul>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10515">📁 Cloud Migration</a>: <span style="color: green;">+$3.75 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10526">📁 Cost Optimization and Efficiency Improvement</a>: <span style="color: green;">+$2.50 M</span></li>
<li><a target="_blank" href="https://base-poc.senseilabs.com/conductor#/project/id/10292">📁 Agency management protocol C</a>: <span style="color: green;">+$2.96 M</span></li>
</ul>
</li>
</ul>
<h4>Risk Mitigation:</h4>
<ul>
<li><strong>Monitor High Variance Projects</strong>: Establish a task force to closely monitor projects with high negative variances and develop mitigation plans.</li>
<li><strong>Reevaluate Budget Allocations</strong>: Reassess budget allocations for projects with significant overspending to ensure alignment with strategic priorities.</li>
</ul>
<p>By addressing these action items and focusing on the identified outliers, the company can work towards improving the financial health of the program and potentially realigning its trajectory to meet the overall target.</p>
</div>`
    }
  ];

  // Historical activities from older times
  const historicalActivities = [
    {
      activityType: 'deal-update',
      platform: 'salesforce',
      icon: '/images/salesforce.png',
      action: 'Opportunity created',
      details: 'Manufacturing automation opportunity - InnovaCorp',
      user: 'Sales Team',
      link: 'https://salesforce.com/opportunities/innovacorp-auto'
    },
    {
      activityType: 'story-update',
      platform: 'jira',
      icon: '/images/jira.png',
      action: 'Epic completed',
      details: 'MANUF-001: Equipment procurement planning epic closed',
      user: 'Project Manager',
      link: 'https://company.atlassian.net/browse/MANUF-001'
    },
    {
      activityType: 'file-change',
      platform: 'sharepoint',
      icon: '/images/sharepoint.png',
      action: 'Folder created',
      details: 'Manufacturing Project 2024 documentation structure established',
      user: 'PMO Office',
      link: 'https://company.sharepoint.com/manufacturing-2024'
    },
    {
      activityType: 'market-data',
      platform: 'harmony',
      insightType: 'market_trend',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Market baseline established',
      details: 'Q4 2023 manufacturing sector analysis completed - baseline metrics set',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/baselines/manuf-q4-2023'
    },
    {
      activityType: 'message',
      platform: 'teams',
      icon: '/images/teams.png',
      action: 'Team created',
      details: 'Manufacturing Excellence team channel established',
      user: 'IT Admin',
      link: 'https://teams.microsoft.com/teams/manufacturing-excellence'
    },
    {
      activityType: 'deal-update',
      platform: 'dealcloud',
      icon: '/images/dealcloud.png',
      action: 'Vendor assessment',
      details: 'Initial vendor capability assessment for automation partners',
      user: 'Procurement Team',
      link: 'https://dealcloud.com/assessments/automation-vendors'
    },
    {
      activityType: 'file-change',
      platform: 'smartsheet',
      icon: '/images/smartsheet.png',
      action: 'Project template',
      details: 'Manufacturing project template created and shared',
      user: 'Program Manager',
      link: 'https://smartsheet.com/templates/manufacturing-project'
    },
    {
      activityType: 'industry-news',
      platform: 'harmony',
      insightType: 'competitor_activity',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Competitive landscape',
      details: 'Manufacturing sector competitive analysis - 12 key players identified',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/competitive/manufacturing-landscape'
    },
    {
      activityType: 'story-update',
      platform: 'jira',
      icon: '/images/jira.png',
      action: 'Project setup',
      details: 'MANUF project board created with initial workflows',
      user: 'DevOps Team',
      link: 'https://company.atlassian.net/projects/MANUF'
    },
    {
      activityType: 'regulatory-update',
      platform: 'harmony',
      insightType: 'risk_alert',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      action: 'Regulatory scan',
      details: 'Manufacturing compliance requirements scan - 23 regulations identified',
      user: 'Harmony Insights',
      link: 'https://insights.harmony.com/regulatory/manufacturing-compliance'
    }
  ];

  // Initialize activities with historical items plus recent ones
  useEffect(() => {
    const now = Date.now();
    
    // Find the Harmony Briefing from activityPool
    const briefingIndex = activityPool.findIndex(activity => activity.activityType === 'harmony-briefing');
    const briefingActivity = activityPool[briefingIndex];
    
    // Create recent activities with Harmony Briefing as second item
    const recentActivities = [
      // Most recent item (first from pool)
      {
        ...activityPool[0],
        id: `recent_${now}_0`,
        timestamp: new Date(now - 1 * 60000 * 30) // 30 minutes ago
      },
      // Second most recent: Harmony Briefing
      {
        ...briefingActivity,
        id: `recent_${now}_briefing`,
        timestamp: new Date(now - 2 * 60000 * 30) // 60 minutes ago
      },
      // Third most recent item (second from pool)
      {
        ...activityPool[1],
        id: `recent_${now}_2`,
        timestamp: new Date(now - 3 * 60000 * 30) // 90 minutes ago
      }
    ];
    
    const oldActivities = historicalActivities.map((activity, index) => ({
      ...activity,
      id: `historical_${now + index}`,
      timestamp: new Date(now - (index + 4) * 60000 * 60 * 2) // Starting 8 hours ago, spaced 2 hours apart
    }));
    
    setActivities([...recentActivities, ...oldActivities]);
    setNextActivityIndex(2); // Start from index 2 since we used 0, 1, and the briefing
  }, []);

  // Auto-add new activities
  useEffect(() => {
    const scheduleNextActivity = () => {
      const minDelay = 30000; // 30 seconds
      const maxDelay = 120000; // 2 minutes
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      
      intervalRef.current = setTimeout(() => {
        if (activities.length < 20 && nextActivityIndex < activityPool.length) {
          const newActivityId = `new_${Date.now()}`;
          const newActivity = {
            ...activityPool[nextActivityIndex % activityPool.length],
            id: newActivityId,
            timestamp: new Date()
          };
          
          setActivities(prev => [newActivity, ...prev]);
          setNextActivityIndex(prev => prev + 1);
          
          // Trigger animation
          setNewItemId(newActivityId);
          setTimeout(() => setNewItemId(null), 2000); // Clear animation after 2 seconds
        }
        
        if (activities.length < 20) {
          scheduleNextActivity();
        }
      }, delay);
    };

    if (activities.length > 0 && activities.length < 20) {
      scheduleNextActivity();
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [activities.length, nextActivityIndex, activityPool.length]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);
  
  // Filter activities based on selected filters
  const filteredActivities = activities.filter(activity => {
    const matchesActivityType = selectedActivityTypes.includes(activity.activityType);
    const matchesPlatform = selectedPlatforms.includes(activity.platform);
    const matchesInsightType = activity.insightType ? selectedInsightTypes.includes(activity.insightType) : true;
    
    return matchesActivityType && matchesPlatform && matchesInsightType;
  });
  
  const toggleActivityType = (activityType: string) => {
    setSelectedActivityTypes(prev => 
      prev.includes(activityType) 
        ? prev.filter(t => t !== activityType)
        : [...prev, activityType]
    );
  };
  
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleInsightType = (insightType: string) => {
    setSelectedInsightTypes(prev => 
      prev.includes(insightType)
        ? prev.filter(t => t !== insightType)
        : [...prev, insightType]
    );
  };
  
  const handleFilterToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFilters(!showFilters);
  };
  
  // Integration configuration data
  const integrationConfig: Record<string, {
    name: string;
    icon: string;
    type: 'platform' | 'insight';
    entities?: string[];
    fields?: string[];
  }> = {
    // Third party platforms
    salesforce: {
      name: 'Salesforce',
      icon: '/images/salesforce.png',
      type: 'platform',
      entities: ['Companies', 'Opportunities', 'Leads', 'Accounts', 'Contacts']
    },
    teams: {
      name: 'Microsoft Teams',
      icon: '/images/teams.png',
      type: 'platform',
      entities: ['Channels', 'Chats', 'Meetings', 'Files']
    },
    jira: {
      name: 'Jira',
      icon: '/images/jira.png',
      type: 'platform', 
      entities: ['Epics', 'Stories', 'Tasks', 'Bugs', 'Projects']
    },
    sharepoint: {
      name: 'SharePoint',
      icon: '/images/sharepoint.png',
      type: 'platform',
      entities: ['Document Libraries', 'Lists', 'Sites', 'Pages']
    },
    dealcloud: {
      name: 'DealCloud',
      icon: '/images/dealcloud.png', 
      type: 'platform',
      entities: ['Deals', 'Companies', 'Contacts', 'Pipeline Stages']
    },
    smartsheet: {
      name: 'Smartsheet',
      icon: '/images/smartsheet.png',
      type: 'platform',
      entities: ['Sheets', 'Reports', 'Dashboards', 'Workspaces']
    },
    planview: {
      name: 'Planview',
      icon: '/images/planview.png',
      type: 'platform',
      entities: ['Projects', 'Portfolios', 'Resources', 'Timesheets']
    },
    msproject: {
      name: 'Microsoft Project',
      icon: '/images/msproject.png',
      type: 'platform',
      entities: ['Projects', 'Tasks', 'Resources', 'Timelines']
    },
    // Harmony insights
    market_trend: {
      name: 'Market Trends',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      type: 'insight',
      fields: ['Keywords to track', 'Market segments', 'Geographic regions', 'Update frequency']
    },
    competitor_activity: {
      name: 'Competitor Activity',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      type: 'insight',
      fields: ['Competitor companies', 'Activity types', 'Alert thresholds', 'Notification preferences']
    },
    customer_behavior: {
      name: 'Customer Behavior',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      type: 'insight',
      fields: ['Customer segments', 'Behavior patterns', 'Tracking metrics', 'Analysis timeframe']
    },
    risk_alert: {
      name: 'Risk Alerts', 
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      type: 'insight',
      fields: ['Risk categories', 'Severity levels', 'Alert frequency', 'Escalation rules']
    },
    opportunity: {
      name: 'Opportunities',
      icon: 'https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png',
      type: 'insight',
      fields: ['Opportunity types', 'Value thresholds', 'Market focus', 'Assessment criteria']
    }
  };

  return (
    <>
    <Card 
      title="Activity Feed" 
      className="col-span-2"
      onMenuClick={() => setShowWidgetMenu(!showWidgetMenu)}
      showMenu={showWidgetMenu}
      menuRef={widgetMenuRef}
      menuContent={
        <div className="py-1 min-w-[280px]">
          <button
            onClick={() => {
              setShowConfigModal(true);
              setShowWidgetMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
          >
            <span>⚙️</span>
            Configure Activity Feed integrations...
          </button>
          <button
            onClick={() => {
              setShowBriefingsModal(true);
              setShowWidgetMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
          >
            <span>📋</span>
            Manage Harmony Briefings...
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={() => {
              setShowWidgetMenu(false);
              // Trigger widget discussion - will be handled by Harmony Sidebar and parent
              const widgetInfo = {
                name: 'Activity Feed',
                type: 'widget',
                data: `Showing ${filteredActivities.length} activities from various platforms and integrations`
              };
              window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
          >
            <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
            Chat with Harmony...
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Filter Controls */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Filter by:</span>
            <button
              ref={filterButtonRef}
              onClick={handleFilterToggle}
              className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <span>Activity types and platforms</span>
              <span className="text-xs">{showFilters ? '▲' : '▼'}</span>
            </button>
          </div>
          <div className="text-xs text-slate-500">
            {filteredActivities.length} of {activities.length} activities
          </div>
        </div>
        
        {/* Comprehensive Filter Options */}
        {showFilters && (
          <div ref={filtersRef} className="mb-4 p-4 bg-slate-50 rounded-lg max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Activity Types */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Activity Types</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.entries(activityTypeLabels).sort(([,a], [,b]) => a.localeCompare(b)).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedActivityTypes.includes(key)}
                        onChange={() => toggleActivityType(key)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Platforms */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Platforms</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.entries(platformLabels).sort(([,a], [,b]) => a.localeCompare(b)).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(key)}
                        onChange={() => togglePlatform(key)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Insight Types */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Insight Types</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.entries(insightTypeLabels).sort(([,a], [,b]) => a.localeCompare(b)).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedInsightTypes.includes(key)}
                        onChange={() => toggleInsightType(key)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                {selectedActivityTypes.length} activity types, {selectedPlatforms.length} platforms, {selectedInsightTypes.length} insights selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedActivityTypes([]);
                    setSelectedPlatforms([]);
                    setSelectedInsightTypes([]);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-800 px-2 py-1 hover:bg-slate-200 rounded transition-colors"
                >
                  Clear all
                </button>
                <button
                  onClick={() => {
                    setSelectedActivityTypes(Object.keys(activityTypeLabels));
                    setSelectedPlatforms(Object.keys(platformLabels));
                    setSelectedInsightTypes(Object.keys(insightTypeLabels));
                  }}
                  className="text-xs text-slate-600 hover:text-slate-800 px-2 py-1 hover:bg-slate-200 rounded transition-colors"
                >
                  Select all
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Activity List */}
        <div className="flex-1 max-h-80 overflow-y-auto space-y-3">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id} 
              className={`flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all duration-300 ${
                newItemId === activity.id 
                  ? 'animate-pulse bg-blue-50 border-2 border-blue-200 shadow-lg' 
                  : ''
              }`}
            >
              {/* Platform Icon */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {activity.icon.startsWith('/') || activity.icon.startsWith('http') ? (
                  <img 
                    src={activity.icon} 
                    alt={platformLabels[activity.platform as keyof typeof platformLabels]} 
                    className="w-6 h-6 rounded"
                    onError={(e) => {
                      // Fallback to platform initial if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<div class="w-6 h-6 bg-slate-300 rounded flex items-center justify-center text-xs text-slate-600">${platformLabels[activity.platform as keyof typeof platformLabels]?.charAt(0) || 'P'}</div>`;
                    }}
                  />
                ) : (
                  <span className="text-lg">{activity.icon}</span>
                )}
              </div>
              
              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">{activity.action}</span>
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        {platformLabels[activity.platform as keyof typeof platformLabels]}
                      </span>
                      {activity.insightType && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          {insightTypeLabels[activity.insightType as keyof typeof insightTypeLabels]}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 mb-2">{activity.details}</div>
                    
                    {/* View Button - shown for all activities */}
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          if (activity.activityType === 'harmony-briefing' && activity.briefingContent) {
                            setSelectedBriefingTitle(`3D print capabilities in each facility - ${activity.briefingType}`);
                            setSelectedBriefingContent(activity.briefingContent);
                            setShowBriefingViewer(true);
                          } else {
                            window.open(activity.link, '_blank');
                          }
                        }}
                        className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
                      >
                        {(() => {
                          // Determine button text based on activity type
                          if (activity.activityType === 'harmony-briefing') return 'View Briefing';
                          
                          const platformName = platformLabels[activity.platform as keyof typeof platformLabels];
                          const isInternalPlatform = activity.platform === 'conductor' || activity.platform === 'harmony';
                          
                          // Map activity types to appropriate view action
                          let viewAction = 'View';
                          if (activity.activityType === 'meeting') viewAction = 'View Meeting';
                          else if (activity.activityType === 'kpi-update') viewAction = 'View KPI';
                          else if (activity.activityType === 'bug' || activity.activityType === 'issue') viewAction = 'View Bug';
                          else if (activity.activityType === 'pull-request') viewAction = 'View PR';
                          else if (activity.activityType === 'release') viewAction = 'View Release';
                          else if (activity.activityType === 'comment') viewAction = 'View Comment';
                          else if (activity.activityType === 'task') viewAction = 'View Task';
                          else if (activity.activityType === 'milestone') viewAction = 'View Milestone';
                          else viewAction = 'View';
                          
                          // Add platform name if external
                          return isInternalPlatform ? viewAction : `${viewAction} in ${platformName}`;
                        })()}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </div>
                  </div>
                  
                  {/* Row Menu Button - moved next to colored dot */}
                  <div className="flex items-start gap-2">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActivityMenu(openActivityMenu === activity.id ? null : activity.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors group"
                        title="More options"
                      >
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                      
                      {/* Activity Row Menu */}
                      {openActivityMenu === activity.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl min-w-[220px] z-50">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setOpenActivityMenu(null);
                                const widgetInfo = {
                                  name: 'Activity Feed Item',
                                  type: 'widget',
                                  data: {
                                    action: activity.action,
                                    details: activity.details,
                                    platform: platformLabels[activity.platform as keyof typeof platformLabels],
                                    user: activity.user,
                                    timestamp: formatRelativeTime(activity.timestamp)
                                  }
                                };
                                window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors text-sm flex items-center gap-2"
                            >
                              <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
                              Chat with Harmony...
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Activity Type Indicator (colored dot) */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                      activity.platform === 'conductor' ? 'bg-purple-400' :
                      activity.platform === 'harmony' ? 'bg-green-400' : 'bg-blue-400'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>

    {/* Configuration Modal */}
    {showConfigModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex h-full">
            {/* Left sidebar - Integration list */}
            <div className="w-80 bg-slate-50 border-r border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Activity Feed Integrations</h2>
                <p className="text-sm text-slate-600 mt-1">Configure third-party platforms and insights</p>
              </div>
              
              <div className="overflow-y-auto h-full pb-20">
                {/* Third party platforms */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Third Party Platforms</h3>
                  <div className="space-y-1">
                    {Object.entries(integrationConfig)
                      .filter(([_, config]) => config.type === 'platform')
                      .map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedIntegration(key)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            selectedIntegration === key 
                              ? 'bg-blue-100 border border-blue-200 text-blue-900' 
                              : 'hover:bg-slate-100'
                          }`}
                        >
                          <img 
                            src={config.icon} 
                            alt={config.name}
                            className="w-6 h-6 rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML += `<div class="w-6 h-6 bg-slate-300 rounded flex items-center justify-center text-xs">${config.name.charAt(0)}</div>`;
                            }}
                          />
                          <span className="text-sm font-medium">{config.name}</span>
                        </button>
                      ))
                    }
                  </div>
                </div>
                
                {/* Harmony insights */}
                <div className="p-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Harmony Insights</h3>
                  <div className="space-y-1">
                    {Object.entries(integrationConfig)
                      .filter(([_, config]) => config.type === 'insight')
                      .map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedIntegration(key)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            selectedIntegration === key 
                              ? 'bg-green-100 border border-green-200 text-green-900' 
                              : 'hover:bg-slate-100'
                          }`}
                        >
                          <img 
                            src={config.icon} 
                            alt={config.name}
                            className="w-6 h-6 rounded"
                          />
                          <span className="text-sm font-medium">{config.name}</span>
                        </button>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right content - Configuration */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  {selectedIntegration && integrationConfig[selectedIntegration] && (
                    <div className="flex items-center gap-3">
                      <img 
                        src={integrationConfig[selectedIntegration].icon} 
                        alt={integrationConfig[selectedIntegration].name}
                        className="w-8 h-8 rounded"
                      />
                      <h3 className="text-lg font-semibold text-slate-900">
                        {integrationConfig[selectedIntegration].name}
                      </h3>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {selectedIntegration && integrationConfig[selectedIntegration] ? (
                  <div>
                    {integrationConfig[selectedIntegration].type === 'platform' ? (
                      <div>
                        <h4 className="text-base font-medium text-slate-800 mb-4">
                          Connect {integrationConfig[selectedIntegration].name} entities to this project
                        </h4>
                        <div className="space-y-4">
                          {integrationConfig[selectedIntegration].entities?.map((entity: string) => (
                            <div key={entity} className="border border-slate-200 rounded-lg p-4">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                {entity}
                              </label>
                              <div className="space-y-2">
                                <input 
                                  type="text" 
                                  placeholder={`Search ${entity.toLowerCase()}...`}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="text-xs text-slate-500">
                                  Example: Manufacturing Project Channel, Equipment Procurement Epic, Q4 Manufacturing Sheet
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-base font-medium text-slate-800 mb-4">
                          Configure {integrationConfig[selectedIntegration].name}
                        </h4>
                        <div className="space-y-4">
                          {integrationConfig[selectedIntegration].fields?.map((field: string) => (
                            <div key={field} className="">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                {field}
                              </label>
                              {field.includes('frequency') || field.includes('timeframe') ? (
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                  <option>Daily</option>
                                  <option>Weekly</option>
                                  <option>Monthly</option>
                                  <option>Real-time</option>
                                </select>
                              ) : field.includes('threshold') || field.includes('level') ? (
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                  <option>Low</option>
                                  <option>Medium</option>
                                  <option>High</option>
                                  <option>Critical</option>
                                </select>
                              ) : (
                                <textarea 
                                  placeholder={`Enter ${field.toLowerCase()}...`}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="flex justify-end gap-3">
                        <button className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors">
                          Cancel
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          Save Configuration
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Configure Activity Feed</h3>
                      <p className="text-slate-600">Select an integration from the left to configure its settings</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Manage Harmony Briefings Modal */}
    {showBriefingsModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 briefings-modal-overlay">
        <div ref={briefingsModalRef} className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Manage Harmony Briefings</h2>
            <button
              onClick={() => setShowBriefingsModal(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Scheduled Briefings List */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Scheduled Briefings</h3>
              <div className="border border-slate-200 rounded-md max-h-48 overflow-y-auto">
                {briefingsList.length > 0 ? (
                  <div className="divide-y">
                    {briefingsList.map((briefing) => (
                      <div
                        key={briefing.id}
                        className={cls(
                          "p-3 flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 group",
                          selectedBriefingId === briefing.id && "bg-purple-50 hover:bg-purple-50"
                        )}
                        onClick={() => {
                          setSelectedBriefingId(briefing.id);
                          setSelectedAnalysis(briefing.name);
                          setBriefingFrequency(briefing.frequency);
                          setBriefingDay(briefing.day);
                          setBriefingTime(briefing.time);
                          setBriefingDelivery(briefing.deliveryMethods);
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{briefing.name}</div>
                          <div className="text-slate-500">
                            {briefing.frequency} on {briefing.day} at {briefing.time} • Delivered to {briefing.deliveryMethods.join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          {selectedBriefingId === briefing.id && (
                            <div className="text-purple-600">✓</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">No scheduled briefings yet</div>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Analysis</label>
                <div className="border border-slate-300 rounded-md">
                  <div className="p-2 border-b border-slate-200">
                    <input
                      placeholder="Search briefings"
                      value={briefingSearch}
                      onChange={(e) => setBriefingSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto text-sm">
                    {[
                      'Executive Briefing',
                      'Executive Briefing (GPT-4o mini)',
                      'Governance - Projects to investigate',
                      'Governance - Unusual project reviews, last 90 days',
                      'Project Review Trends (trailing 12 months)',
                      'Significant changes over 90 days.',
                      'What are the three worst projects, and what were they 30 days ago?',
                      'Where should I spend my next 20 minutes?'
                    ]
                      .filter(name => name.toLowerCase().includes(briefingSearch.toLowerCase()))
                      .map((name) => (
                        <div
                          key={name}
                          onClick={() => setSelectedAnalysis(name)}
                          className={cls(
                            "px-4 py-2 hover:bg-slate-50 cursor-pointer",
                            selectedAnalysis === name && "bg-purple-50 text-purple-700 font-medium"
                          )}
                        >
                          {name} {selectedAnalysis === name && '✓'}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Schedule controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                  <select
                    value={briefingFrequency}
                    onChange={(e) => setBriefingFrequency(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {briefingFrequency === 'Monthly' ? 'On' : 'Day'}
                  </label>
                  <select
                    value={briefingDay}
                    onChange={(e) => setBriefingDay(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {briefingFrequency === 'Daily' ? (
                      <option>Every Day</option>
                    ) : briefingFrequency === 'Weekly' ? (
                      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d}>{d}</option>)
                    ) : (
                      // Monthly options
                      [
                        'First Monday',
                        'First Tuesday', 
                        'First Wednesday',
                        'First Thursday',
                        'First Friday',
                        'Last Monday',
                        'Last Tuesday',
                        'Last Wednesday',
                        'Last Thursday',
                        'Last Friday',
                        '1st of month',
                        '15th of month',
                        'Last day of month'
                      ].map(d => <option key={d}>{d}</option>)
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={briefingTime}
                    onChange={(e) => setBriefingTime(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Delivery methods */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Methods</label>
                <div className="space-y-2">
                  {['Activity Feed', 'Conductor Notifications', 'Email', 'Microsoft Teams'].sort().map(method => (
                    <label key={method} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={briefingDelivery.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBriefingDelivery([...briefingDelivery, method]);
                          } else {
                            setBriefingDelivery(briefingDelivery.filter(m => m !== method));
                          }
                        }}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="border-t border-slate-200 p-4 flex justify-between gap-3">
            <div>
              {selectedBriefingId && (
                <button
                  onClick={() => {
                    setBriefingsList(briefingsList.filter(b => b.id !== selectedBriefingId));
                    setSelectedBriefingId(null);
                    setSelectedAnalysis('');
                    setBriefingFrequency('Weekly');
                    setBriefingDay('Monday');
                    setBriefingTime('09:00');
                    setBriefingDelivery(['Activity Feed']);
                  }}
                  className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBriefingsModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              {selectedBriefingId ? (
                <button
                  onClick={() => {
                    if (!selectedAnalysis) return;
                    setBriefingsList(briefingsList.map(b =>
                      b.id === selectedBriefingId
                        ? {
                            ...b,
                            name: selectedAnalysis,
                            frequency: briefingFrequency,
                            day: briefingDay,
                            time: briefingTime,
                            deliveryMethods: briefingDelivery
                          }
                        : b
                    ));
                    setSelectedBriefingId(null);
                    setSelectedAnalysis('');
                    setBriefingFrequency('Weekly');
                    setBriefingDay('Monday');
                    setBriefingTime('09:00');
                    setBriefingDelivery(['Activity Feed']);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedAnalysis}
                >
                  Update
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!selectedAnalysis) return;
                    const newId = String(Date.now());
                    setBriefingsList([
                      ...briefingsList,
                      {
                        id: newId,
                        name: selectedAnalysis,
                        frequency: briefingFrequency,
                        day: briefingDay,
                        time: briefingTime,
                        deliveryMethods: briefingDelivery
                      }
                    ]);
                    setSelectedAnalysis('');
                    setBriefingFrequency('Weekly');
                    setBriefingDay('Monday');
                    setBriefingTime('09:00');
                    setBriefingDelivery(['Activity Feed']);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedAnalysis}
                >
                  Add Briefing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Briefing Viewer Modal */}
    {showBriefingViewer && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 briefing-viewer-overlay">
        <div ref={briefingViewerRef} className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 truncate">{selectedBriefingTitle || 'Executive Briefing'}</h2>
            <button onClick={() => setShowBriefingViewer(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center" aria-label="Close modal">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-56px)]">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedBriefingContent }} />
          </div>
        </div>
      </div>
    )}

    </>
  );
};

const HarmonySidebar: React.FC<{ onOpenScenario: () => void }> = ({ onOpenScenario }) => {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [uploadSubmenuOpen, setUploadSubmenuOpen] = useState(false);
  const [agentsMenuOpen, setAgentsMenuOpen] = useState(false);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const agentsMenuRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Chat state
  const [currentChatName, setCurrentChatName] = useState('Thoughts on the rollout');
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const hamburgerMenuRef = useRef<HTMLDivElement | null>(null);
  
  // Sample chat history
  const sampleChats = [
    { name: 'Thoughts on the rollout', date: 'Today, 2:30 PM' },
    { name: 'Budget review discussion', date: 'Yesterday, 4:15 PM' },
    { name: 'Technical requirements', date: 'Jan 14, 10:20 AM' },
    { name: 'Risk assessment meeting', date: 'Jan 13, 3:45 PM' },
    { name: 'Stakeholder alignment', date: 'Jan 13, 11:30 AM' },
    { name: 'Manufacturing timeline', date: 'Jan 12, 2:15 PM' },
    { name: 'Procurement strategy', date: 'Jan 12, 9:20 AM' },
    { name: 'Change management plan', date: 'Jan 11, 4:00 PM' },
    { name: 'Training requirements', date: 'Jan 11, 1:45 PM' },
    { name: 'Quality assurance', date: 'Jan 10, 3:30 PM' },
    { name: 'Vendor evaluation', date: 'Jan 10, 10:15 AM' },
    { name: 'Cost analysis update', date: 'Jan 9, 5:20 PM' },
    { name: 'Project scope review', date: 'Jan 9, 2:10 PM' },
    { name: 'Resource allocation', date: 'Jan 8, 4:45 PM' },
    { name: 'Timeline adjustments', date: 'Jan 8, 11:30 AM' },
    { name: 'Compliance requirements', date: 'Jan 7, 3:15 PM' },
    { name: 'Performance metrics', date: 'Jan 7, 9:40 AM' },
    { name: 'Implementation strategy', date: 'Jan 6, 4:25 PM' },
    { name: 'Team assignments', date: 'Jan 6, 1:20 PM' },
    { name: 'Final approvals needed', date: 'Jan 5, 3:50 PM' },
    { name: 'Launch preparation', date: 'Jan 5, 10:35 AM' },
    { name: 'Post-launch monitoring', date: 'Jan 4, 2:45 PM' },
    { name: 'Success criteria definition', date: 'Jan 4, 11:15 AM' }
  ];
  
  // Filter chats based on search query
  const filteredChats = sampleChats.filter(chat => 
    chat.name.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );
  
  // Chat data storage - keyed by chat name
  const chatData: Record<string, ChatMessage[]> = {
    'Thoughts on the rollout': [
      {
        id: '1',
        type: 'user',
        content: 'Hello everyone, I wanted to get your thoughts on the 3D printing capabilities rollout. @CFOAgent @ChiefTechnicalOfficerAgent what do you think?',
        timestamp: new Date('2024-01-15T10:30:00')
      },
      {
        id: '2', 
        type: 'harmony',
        content: 'Great question! I\'ve analyzed the project data and can provide some insights. Let me bring in some relevant stakeholders.',
        timestamp: new Date('2024-01-15T10:31:00')
      },
      {
        id: '3',
        type: 'agent',
        content: 'From a financial perspective, we need to ensure ROI targets are met. The capex requirements look significant - have we validated the business case assumptions?',
        sender: 'CFOAgent',
        timestamp: new Date('2024-01-15T10:32:00')
      },
      {
        id: '4',
        type: 'agent', 
        content: 'I can help assess the technical feasibility. The integration with existing manufacturing systems will be complex - we should plan for adequate testing phases.',
        sender: 'ChiefTechnicalOfficerAgent',
        timestamp: new Date('2024-01-15T10:33:00')
      }
    ],
    'Budget review discussion': [
      {
        id: '5',
        type: 'user',
        content: 'We need to review the budget allocations for Q2. @CFOAgent can you walk us through the latest numbers?',
        timestamp: new Date('2024-01-14T16:15:00')
      },
      {
        id: '6',
        type: 'agent',
        content: 'Certainly! Our Q2 budget shows a 15% increase in operational costs, primarily driven by the new equipment purchases. However, we\'re tracking 8% under on personnel costs.',
        sender: 'CFOAgent',
        timestamp: new Date('2024-01-14T16:16:00')
      },
      {
        id: '7',
        type: 'harmony',
        content: 'I\'ve identified three cost optimization opportunities that could save approximately $2.3M this quarter. Would you like me to detail these?',
        timestamp: new Date('2024-01-14T16:17:00')
      },
      {
        id: '8',
        type: 'user',
        content: 'Yes please, that would be very helpful. Also @ResourcingAgent what\'s our current headcount vs plan?',
        timestamp: new Date('2024-01-14T16:18:00')
      },
      {
        id: '9',
        type: 'agent',
        content: 'We\'re currently at 94% of planned headcount. The 6% gap is primarily in specialized technical roles where we\'re experiencing longer recruitment cycles.',
        sender: 'ResourcingAgent',
        timestamp: new Date('2024-01-14T16:19:00')
      }
    ]
  };
  
  // Current chat messages state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(chatData['Thoughts on the rollout']);
  
  // Listen for widget discussion requests
  useEffect(() => {
    const handleDiscussWidget = (event: Event) => {
      const customEvent = event as CustomEvent;
      const widgetInfo = customEvent.detail;
      
      // Create widget context card message with attachment
      const widgetCard: ChatMessage = {
        id: `widget-${Date.now()}`,
        type: 'user',
        content: `Let's discuss ${widgetInfo.name}`,
        timestamp: new Date(),
        attachments: [{
          type: 'widget',
          widgetName: widgetInfo.name,
          widgetData: widgetInfo.data
        }]
      };
      
      // Add Harmony's response
      const harmonyResponse: ChatMessage = {
        id: `harmony-${Date.now()}`,
        type: 'harmony',
        content: `I've pulled in ${widgetInfo.name}. What would you like to know about it?`,
        timestamp: new Date()
      };
      
      // Start new chat with widget context
      const newChatName = `Discussion: ${widgetInfo.name}`;
      setCurrentChatName(newChatName);
      setChatMessages([widgetCard, harmonyResponse]);
    };
    
    window.addEventListener('discussWithHarmony', handleDiscussWidget);
    return () => window.removeEventListener('discussWithHarmony', handleDiscussWidget);
  }, []);
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
        setUploadSubmenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addMenuOpen]);

  useEffect(() => {
    if (!agentsMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (agentsMenuRef.current && !agentsMenuRef.current.contains(e.target as Node)) {
        setAgentsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [agentsMenuOpen]);

  // Handle keyboard navigation for agents menu
  useEffect(() => {
    if (!agentsMenuOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = (selectedAgentIndex + 1) % AGENTS.length;
        setSelectedAgentIndex(newIndex);
        // Scroll selected item into view
        setTimeout(() => {
          const selectedElement = document.querySelector(`[data-agent-index="${newIndex}"]`);
          selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = (selectedAgentIndex - 1 + AGENTS.length) % AGENTS.length;
        setSelectedAgentIndex(newIndex);
        // Scroll selected item into view
        setTimeout(() => {
          const selectedElement = document.querySelector(`[data-agent-index="${newIndex}"]`);
          selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleAgentSelect(AGENTS[selectedAgentIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setAgentsMenuOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [agentsMenuOpen, selectedAgentIndex]);

  const handleAgentSelect = (agent: Agent) => {
    // Call the AgentInput's insert function
    if ((window as any).__insertAgent) {
      (window as any).__insertAgent(agent);
    }
    setAgentsMenuOpen(false);
    setSelectedAgentIndex(0);
  };
  
  // Handle switching to a different chat
  const handleSwitchChat = (chatName: string) => {
    setCurrentChatName(chatName);
    // Load messages for the selected chat, or empty array if chat doesn't exist
    setChatMessages(chatData[chatName] || []);
    setHamburgerMenuOpen(false);
  };
  
  // Handle sending a new message
  const handleSendMessage = (content: string, attachments?: { type: 'scenario' }[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(), // Simple ID generation
      type: 'user',
      content: content,
      timestamp: new Date(),
      attachments: attachments
    };
    
    // Add message to current chat data
    chatData[currentChatName] = [...(chatData[currentChatName] || []), newMessage];
    setChatMessages(prev => [...prev, newMessage]);
    
    // If message has scenario attachment, trigger agent responses
    if (attachments && attachments.some(a => a.type === 'scenario')) {
      triggerScenarioResponses();
    }
  };
  
  // Trigger agent responses to scenario
  const triggerScenarioResponses = () => {
    const responses: ChatMessage[] = [
      {
        id: `harmony-${Date.now()}`,
        type: 'harmony',
        content: 'Excellent! I\'ve analyzed this scenario and can see some key insights. Let me bring in the relevant stakeholders to provide their perspective on this analysis.',
        timestamp: new Date(Date.now() + 2000)
      },
      {
        id: `cfo-${Date.now()}`,
        type: 'agent',
        content: 'Looking at the strategic alignment score of 8.1, this is very promising. The 73% resource utilization suggests we have capacity for additional projects. I\'d recommend prioritizing the highest ROI initiatives first.',
        sender: 'CFOAgent',
        timestamp: new Date(Date.now() + 4000)
      },
      {
        id: `cto-${Date.now()}`,
        type: 'agent',
        content: 'From a technical standpoint, having 11 projects in the scenario is manageable if we sequence them properly. The resource utilization data will help us identify potential bottlenecks in our technical delivery capacity.',
        sender: 'ChiefTechnicalOfficerAgent',
        timestamp: new Date(Date.now() + 6000)
      },
      {
        id: `pmo-${Date.now()}`,
        type: 'agent',
        content: 'The priority average of 7.3 indicates we have a well-balanced portfolio. I suggest we review the timeline dependencies between these projects to optimize our delivery schedule.',
        sender: 'PMODirectorAgent',
        timestamp: new Date(Date.now() + 8000)
      }
    ];
    
    // Add responses with delays
    responses.forEach((response, index) => {
      setTimeout(() => {
        chatData[currentChatName] = [...(chatData[currentChatName] || []), response];
        setChatMessages(prev => [...prev, response]);
      }, (index + 1) * 2000); // 2 second intervals
    });
  };
  
  // Handle adding scenario planner to chat
  const handleAddScenarioToChat = () => {
    // Add scenario as pending attachment to input
    if ((window as any).__addAttachment) {
      (window as any).__addAttachment({ type: 'scenario' });
    }
  };
  
  // Handle starting a new chat
  const handleNewChat = () => {
    setChatMessages([]);
    setCurrentChatName('New chat');
    
    // Focus the input box
    setTimeout(() => {
      const inputElement = document.querySelector('[contenteditable]') as HTMLElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };
  
  // Focus input when sidebar is opened (you can call this from parent)
  const focusInput = () => {
    setTimeout(() => {
      const inputElement = document.querySelector('[contenteditable]') as HTMLElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };
  
  // Hamburger menu click-away handler
  useEffect(() => {
    if (!hamburgerMenuOpen) {
      setChatSearchQuery(''); // Clear search when menu closes
      return;
    }
    const handler = (e: MouseEvent) => {
      if (hamburgerMenuRef.current && !hamburgerMenuRef.current.contains(e.target as Node)) {
        setHamburgerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [hamburgerMenuOpen]);
  
  // Listen for scenario addition events
  useEffect(() => {
    const handleAddScenario = () => {
      handleAddScenarioToChat();
    };
    
    window.addEventListener('addScenarioToChat', handleAddScenario);
    return () => window.removeEventListener('addScenarioToChat', handleAddScenario);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex-1 min-w-0 pr-2">
          <div className="font-semibold text-[14px] text-[#211534] truncate">Project: 3D print capabilities in each facility</div>
          <div className="text-[12px] text-slate-500 truncate">{currentChatName}</div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* New Chat Button */}
          <button 
            onClick={handleNewChat}
            className="p-1.5 text-slate-600 hover:text-slate-800 cursor-pointer" 
            aria-label="Start new chat"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          
          {/* Hamburger Menu */}
          <div className="relative" ref={hamburgerMenuRef}>
            <button 
              onClick={() => setHamburgerMenuOpen(!hamburgerMenuOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-800 cursor-pointer" 
              aria-label="Open chat history"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            
            {/* Chat History Menu */}
            {hamburgerMenuOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border rounded shadow-lg text-sm min-w-[280px] max-w-[320px] z-50">
                {/* Search box */}
                <div className="p-3 border-b border-slate-100">
                  <input 
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#513295] focus:border-[#513295]"
                    placeholder="Search chats..."
                  />
                </div>
                
                {/* Chat list */}
                <div className="max-h-[240px] overflow-y-auto">
                  {filteredChats.length > 0 ? (
                    filteredChats.map((chat, index) => (
                      <button 
                        key={index}
                        className={cls(
                          "w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0",
                          chat.name === currentChatName && "bg-slate-50"
                        )}
                        onClick={() => handleSwitchChat(chat.name)}
                      >
                        <div className="font-medium text-[13px] text-slate-900 mb-1 truncate">{chat.name}</div>
                        <div className="text-[11px] text-slate-500">{chat.date}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] text-slate-500 text-center">
                      No chats found
                    </div>
                  )}
                </div>
                
                {/* All chats link */}
                <div className="border-t border-slate-100">
                  <button className="w-full text-left px-4 py-3 hover:bg-slate-50 text-[13px] text-[#513295] font-medium">
                    All Harmony chats
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        {chatMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      
      <footer className="p-3 border-t border-slate-200">
        <AgentInput 
          placeholder="Ask anything..." 
          onSendMessage={handleSendMessage}
          addMenuOpen={addMenuOpen}
          setAddMenuOpen={setAddMenuOpen}
          uploadSubmenuOpen={uploadSubmenuOpen}
          setUploadSubmenuOpen={setUploadSubmenuOpen}
          agentsMenuOpen={agentsMenuOpen}
          setAgentsMenuOpen={setAgentsMenuOpen}
          selectedAgentIndex={selectedAgentIndex}
          setSelectedAgentIndex={setSelectedAgentIndex}
          onOpenScenario={onOpenScenario}
          handleAgentSelect={handleAgentSelect}
          addMenuRef={addMenuRef}
          agentsMenuRef={agentsMenuRef}
        />
      </footer>
    </div>
  );
};

function App() {
  const { account, logout } = useAuth();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [showHarmonyReviewsModal, setShowHarmonyReviewsModal] = useState(false);
  const [showProjectReviewsMenu, setShowProjectReviewsMenu] = useState(false);
  const [showProjectStagesMenu, setShowProjectStagesMenu] = useState(false);
  const [showNetBenefitMenu, setShowNetBenefitMenu] = useState(false);
  const [showPurposeMenu, setShowPurposeMenu] = useState(false);
  const [showFinancialApprovalsMenu, setShowFinancialApprovalsMenu] = useState(false);
  const [showRiskAssessmentMenu, setShowRiskAssessmentMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileConnectModal, setShowMobileConnectModal] = useState(false);
  const [rocketOpen, setRocketOpen] = useState(true);
  const [briefOpen, setBriefOpen] = useState<Record<string, boolean>>({ Distribution: false, Finance: false, IT: false, Manufacturing: true });
  
  const projectReviewsMenuRef = useRef<HTMLDivElement>(null);
  const projectStagesMenuRef = useRef<HTMLDivElement>(null);
  const netBenefitMenuRef = useRef<HTMLDivElement>(null);
  const purposeMenuRef = useRef<HTMLDivElement>(null);
  const financialApprovalsMenuRef = useRef<HTMLDivElement>(null);
  const riskAssessmentMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const leftW = leftOpen ? LEFT_EXPANDED : LEFT_COLLAPSED;
  const rightW = rightOpen ? 340 : 0;

  // hotkey 'h' to toggle Harmony only when not focused in inputs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        if (!isEditableTarget(e.target)) {
          setRightOpen(v => !v);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Handle escape key for Harmony Reviews modal
  useEffect(() => {
    if (!showHarmonyReviewsModal) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHarmonyReviewsModal(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('main-harmony-modal-overlay')) {
        setShowHarmonyReviewsModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHarmonyReviewsModal]);

  // Close widget menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectReviewsMenuRef.current && !projectReviewsMenuRef.current.contains(event.target as Node)) {
        setShowProjectReviewsMenu(false);
      }
      if (projectStagesMenuRef.current && !projectStagesMenuRef.current.contains(event.target as Node)) {
        setShowProjectStagesMenu(false);
      }
      if (netBenefitMenuRef.current && !netBenefitMenuRef.current.contains(event.target as Node)) {
        setShowNetBenefitMenu(false);
      }
      if (purposeMenuRef.current && !purposeMenuRef.current.contains(event.target as Node)) {
        setShowPurposeMenu(false);
      }
      if (financialApprovalsMenuRef.current && !financialApprovalsMenuRef.current.contains(event.target as Node)) {
        setShowFinancialApprovalsMenu(false);
      }
      if (riskAssessmentMenuRef.current && !riskAssessmentMenuRef.current.contains(event.target as Node)) {
        setShowRiskAssessmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close User menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open sidebar when Discuss with Harmony is triggered
  useEffect(() => {
    const handleDiscussWidget = () => {
      setRightOpen(true);
    };
    window.addEventListener('discussWithHarmony', handleDiscussWidget);
    return () => window.removeEventListener('discussWithHarmony', handleDiscussWidget);
  }, []);

  const navItems = useMemo(() => [
    { icon: "📘", label: "Academy" },
    { icon: "🧰", label: "Tools" },
    { icon: "👥", label: "Organization" },
    { icon: "🧪", label: "PoC" },
    { icon: "⚙️", label: "Admin" },
  ], []);

  return (
    <div className="h-screen w-full bg-gradient-to-b from-purple-50 via-white to-[#F6F6F7] text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full">
        <div className="w-full flex">
          <div style={{ width: LEFT_EXPANDED }} className="bg-white h-16 flex items-center justify-center border-b border-slate-200">
            <BrandLogo />
          </div>
          <div className="flex-1 bg-[#211534] text-white border-b border-[#211534]">
            <div className="flex items-center h-16 px-3 gap-3">
              <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium opacity-95">
                {navItems.map((item) => (
                  <span key={item.label} className="cursor-default flex items-center gap-2">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-3">
                <button aria-label="Add" className="grid place-items-center w-8 h-8 rounded-full bg-white/10 cursor-pointer">➕</button>
                <div className="hidden sm:flex items-center w-36 h-8 px-2 rounded bg-white/10">
                  <span>🔍</span>
                  <input className="ml-1 bg-transparent outline-none text-[12px] placeholder-white/70" placeholder="Search" />
                </div>
                <button onClick={() => setRightOpen((v) => !v)} aria-pressed={rightOpen} title="Toggle Harmony Panel (H)" className={cls("w-8 h-8 rounded-full grid place-items-center transition shadow-sm bg-white/10 cursor-pointer", rightOpen && "ring-2 ring-white/80")}>
                  <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony AI" className="w-5 h-5" />
                </button>
                <button aria-label="Notifications" className="grid place-items-center w-8 h-8 rounded-full bg-white/10 cursor-pointer">🔔</button>
                <button aria-label="Help" className="grid place-items-center w-8 h-8 rounded-full bg-white/10 cursor-pointer">❓</button>
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full bg-white/20 overflow-hidden hover:ring-2 hover:ring-white/40 transition-all cursor-pointer flex items-center justify-center"
                    aria-label="User menu"
                  >
                    {account ? (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        {account.name?.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-300 to-indigo-500" />
                    )}
                  </button>
                  {showUserMenu && account && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-lg shadow-xl min-w-[240px] z-50">
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {account.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">{account.name}</div>
                            <div className="text-xs text-slate-500 truncate">{account.username}</div>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowMobileConnectModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <span>📱</span>
                          <span>Connect Mobile App</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <aside style={{ width: leftW }} className="absolute inset-y-0 left-0 border-r border-purple-200 bg-white overflow-y-auto">
          <div className="p-3 relative">
            <WorkspaceChip leftOpen={leftOpen} onClick={() => setWsOpen((v) => !v)} />
            <div className="relative">{wsOpen && <WorkspaceDropdown open={wsOpen} />}</div>
          </div>
          <nav className="px-3 pb-3 text-[14px]">
            <ul className="space-y-1">
              {[
                { icon: "📊", text: "SteerCo Dashboard" },
                { icon: "🏛️", text: "EPMO/TMO" },
                { icon: "🎯", text: "Strategic Objectives" },
                { icon: "🧭", text: "SPM" },
              ].map((it) => (
                <li key={it.text} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-purple-50 text-slate-800 cursor-pointer">
                  <span className="w-6 text-center">{it.icon}</span>
                  {leftOpen && <span className="truncate">{it.text}</span>}
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-slate-200" />
            <ul className="space-y-1">
              <li className="flex items-center gap-3 px-2 py-2 rounded hover:bg-purple-50 text-slate-800 cursor-pointer">
                <span className="w-6 text-center">🤖</span>
                {leftOpen && <span className="truncate">Harmony AI</span>}
              </li>
            </ul>
            <div className="my-2 h-px bg-slate-200" />
            <ul className="space-y-1">
              {[
                { icon: "🗓️", text: "Timeline" },
                { icon: "🛡️", text: "Governance" },
                { icon: "👥", text: "Team" },
                { icon: "⚡", text: "Flash Reports" },
                { icon: "📁", text: "Files" },
              ].map((it) => (
                <li key={it.text} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-purple-50 text-slate-800 cursor-pointer">
                  <span className="w-6 text-center">{it.icon}</span>
                  {leftOpen && <span className="truncate">{it.text}</span>}
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-slate-200" />
            <ul className="space-y-1">
              {[
                { icon: "📂", text: "My Projects" },
                { icon: "🧑‍💼", text: "My Work" },
              ].map((it) => (
                <li key={it.text} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-purple-50 text-slate-800 cursor-pointer">
                  <span className="w-6 text-center">{it.icon}</span>
                  {leftOpen && <span className="truncate">{it.text}</span>}
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-slate-200" />
            <div className="px-1 py-2">
              <button onClick={() => setBrowseOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded cursor-pointer">
                <span className="flex items-center gap-2">
                  <span className="w-5 text-center">🔎</span>
                  {leftOpen && <span>Browse...</span>}
                </span>
                <span className="text-slate-500">{leftOpen && (browseOpen ? "×" : ">")}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Left rail toggle tab */}
        <button onClick={() => setLeftOpen((v) => !v)} className="absolute z-[70] w-6 h-6 rounded-full bg-white border border-purple-200 shadow grid place-items-center text-purple-700 cursor-pointer" style={{ top: 16, left: leftW - 12 }} aria-label="Toggle left rail">
          {leftOpen ? <ChevLeftCircle /> : <ChevRightCircle />}
        </button>

        {/* Right rail toggle tab */}
        <button onClick={() => setRightOpen((v) => !v)} aria-label="Toggle right rail" className={cls("absolute z-[70] w-6 h-6 rounded-full bg-white border border-purple-200 shadow grid place-items-center text-purple-700 cursor-pointer", browseOpen && "pointer-events-none")} style={{ top: 16, right: rightW ? rightW - 12 : -12 }}>
          {rightOpen ? <ChevRightCircle /> : <ChevLeftCircle />}
        </button>

        {/* Browse flyout */}
        {browseOpen && (
          <div>
            <div className="fixed inset-0 z-[1100] bg-black/40" onClick={() => setBrowseOpen(false)} />
            <div className="fixed inset-y-0 z-[1110] flex" style={{ left: leftW, right: 0, width: `min(980px, calc(100vw - ${leftW}px))` }}>
              <div className="w-[480px] h-full" style={{ backgroundColor: "#513295", color: "white" }}>
                <div className="flex items-center justify-between px-4 h-12" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="flex items-center gap-2 text-[13px]"><span>Browsing by</span><div className="px-2 py-1 rounded" style={{ background: "rgba(255,255,255,.15)" }}>Work hierarchy ▾</div></div>
                  <button onClick={() => setBrowseOpen(false)} className="text-white/90 hover:text-white cursor-pointer">✕</button>
                </div>
                <div className="px-4 py-3 text-[13px]">
                  <div className="flex items-center gap-2 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}><span className="w-5 text-center">≡</span><span>All Items</span><span className="ml-auto">▸</span></div>
                  {["ERP Migration", "ESG", "Transformation"].map((rk) => (
                    <div key={rk} className="py-1">
                      <button onClick={() => setRocketOpen((v) => !v)} className="w-full flex items-center gap-2 py-2 cursor-pointer"><span className="w-5 text-center">🚀</span><span className="truncate">{rk}</span><span className="ml-auto">{rocketOpen ? "▾" : "▸"}</span></button>
                      {rocketOpen && (
                        <div className="pl-7">
                          {["Distribution", "Finance", "IT", "Manufacturing"].map((b) => (
                            <div key={b} className="py-1">
                              <button onClick={() => setBriefOpen((prev) => ({ ...prev, [b]: !prev[b] }))} className="w-full flex items-center gap-2 py-2 cursor-pointer"><span className="w-5 text-center">💼</span><span className="truncate">{b}</span><span className="ml-auto">{briefOpen[b] ? "▾" : "▸"}</span></button>
                              {briefOpen[b] && (
                                <div className="pl-6">
                                  {(b === "Manufacturing"
                                    ? [
                                        "3D print capabilities in each facility",
                                        "Line Balancing Optimization",
                                        "Manufacturing Line Cycle Time Optimization",
                                        "OEE (Overall Equipment Effectiveness) Program Launch",
                                        "Preventive Maintenance U...",
                                        "Robotics upgrade on packaging line",
                                        "Scrap and Rework Reducti...",
                                        "Shift Pattern Redesign",
                                        "Tooling Changeover Reduct...",
                                      ]
                                    : ["Marketing", "R&D", "Sales", "Services", "Sourcing", "Test PMO", "TMO"]
                                  ).map((label) => (
                                    <div key={`${b}::${label}`} className={cls("flex items-center gap-2 py-2", label === "3D print capabilities in each facility" && "bg-white/10")}>
                                      <span className="w-5 text-center">📁</span>
                                      <span className="truncate">{label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-[360px] h-full" style={{ backgroundColor: "#402972", color: "white" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="text-xs uppercase opacity-80">Projects</div>
                  <div className="truncate font-medium">3D print capabilities in each facility</div>
                </div>
                <div className="px-4 py-3 text-[13px]">
                  {[
                    ["Summary", "📄"],
                    ["Board", "📋"],
                    ["Reviews", "🗂️"],
                    ["Files", "📁"],
                    ["KPIs", "📈"],
                    ["Timeline", "🗓️"],
                    ["Team", "👥"],
                  ].map(([label, icon]) => (
                    <div key={String(label)} className="flex items-center gap-2 py-2"><span className="w-5 text-center">{String(icon)}</span><span>{String(label)}</span></div>
                  ))}
                  <div className="my-2 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
                  {[
                    ["Standard Tasks", "🧱"],
                    ["Risks", "⚠️"],
                    ["Issues", "❗"],
                    ["Interdependencies", "🔗"],
                    ["All Tasks", "✅"],
                    ["Milestones", "🎯"],
                  ].map(([label, icon]) => (
                    <div key={String(label)} className="flex items-center gap-2 py-2"><span className="w-5 text-center">{String(icon)}</span><span>{String(label)}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar */}
        <aside style={{ width: rightW }} className="absolute inset-y-0 right-0 border-l border-purple-200 bg-white/70 backdrop-blur overflow-y-auto">
          <HarmonySidebar onOpenScenario={() => setScenarioOpen(true)} />
        </aside>

        {/* Main content */}
        <main style={{ marginLeft: leftW, marginRight: rightW }} className="h-full overflow-y-auto p-6">
          <div className="max-w-[1600px] mx-auto">
            <ProjectHeader />
            <div className="space-y-4">
              {/* Row 1: Project Stages, Project Reviews, and Net Benefit */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card 
                  title="Project Stages" 
                  subtitle="2. Implementing"
                  onMenuClick={() => setShowProjectStagesMenu(!showProjectStagesMenu)}
                  showMenu={showProjectStagesMenu}
                  menuRef={projectStagesMenuRef}
                  menuContent={
                    <div className="py-1 min-w-[220px]">
                      <button
                        onClick={() => {
                          setShowProjectStagesMenu(false);
                          const widgetInfo = {
                            name: 'Project Stages',
                            type: 'widget',
                            data: '4 project stages: Planning (complete), Implementing (current), Scaling and Completing (pending), Monitoring (pending)'
                          };
                          window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
                      >
                        <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
                        Chat with Harmony...
                      </button>
                    </div>
                  }
                >
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 pr-4 font-medium text-slate-600">Stage</th>
                          <th className="text-left py-2 px-4 font-medium text-slate-600">Finish</th>
                          <th className="text-left py-2 pl-4 font-medium text-slate-600">Original due date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            stage: "1. Planning",
                            description: "Approved by Drew Thompson",
                            dateApproved: "Sep 5, 2025",
                            status: "Revert",
                            finish: "Sep 5, 2025",
                            originalDue: "Sep 5, 2025",
                            statusColor: "green",
                            statusIcon: "check"
                          },
                          {
                            stage: "2. Implementing",
                            description: "Approve this Project Stage from inside the Task",
                            dateApproved: "",
                            status: "current",
                            finish: "Oct 1, 2025",
                            originalDue: "Sep 9, 2025",
                            statusColor: "blue",
                            statusIcon: "progress"
                          },
                          {
                            stage: "3. Scaling and Completing",
                            description: "",
                            dateApproved: "",
                            status: "pending",
                            finish: "Sep 14, 2026",
                            originalDue: "Sep 14, 2026",
                            statusColor: "gray",
                            statusIcon: "pending"
                          },
                          {
                            stage: "4. Monitoring",
                            description: "",
                            dateApproved: "",
                            status: "pending",
                            finish: "Oct 15, 2026",
                            originalDue: "Oct 15, 2026",
                            statusColor: "gray",
                            statusIcon: "pending"
                          }
                        ].map((item, index) => (
                          <tr key={index} className="border-b border-slate-100">
                            <td className="py-3 pr-4">
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  {item.statusIcon === "check" && (
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                  {item.statusIcon === "progress" && (
                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                      <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                  {item.statusIcon === "pending" && (
                                    <div className="w-6 h-6 rounded-full bg-gray-300">
                                      <div className="w-4 h-4 mt-1 ml-1 border border-gray-400 rounded-sm"></div>
                                    </div>
                                  )}
                                  {index < 3 && (
                                    <div className={`w-0.5 h-8 mt-1 ${
                                      item.statusIcon === "check" ? "bg-green-500" :
                                      item.statusIcon === "progress" ? "bg-blue-500" :
                                      "bg-gray-300"
                                    }`}></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium ${
                                    item.statusIcon === "progress" ? "text-blue-700 cursor-pointer hover:text-blue-800 hover:underline" : "text-slate-800"
                                  }`}
                                  onClick={item.statusIcon === "progress" ? () => console.log('Implementing clicked') : undefined}
                                  >
                                    {item.stage}
                                  </div>
                                  {item.description && (
                                    <div className="text-sm text-slate-500 mt-1">
                                      {item.description}
                                    </div>
                                  )}
                                  {item.dateApproved && (
                                    <div className="text-sm text-slate-500 mt-1">
                                      {item.dateApproved} | <span className="text-blue-600">{item.status}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {item.finish}
                            </td>
                            <td className="py-3 pl-4 text-slate-700">
                              {item.originalDue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                
                <Card 
                  title="Project Reviews"
                  onMenuClick={() => setShowProjectReviewsMenu(!showProjectReviewsMenu)}
                  showMenu={showProjectReviewsMenu}
                  menuRef={projectReviewsMenuRef}
                  menuContent={
                    <div className="py-1 min-w-[240px]">
                      <button
                        onClick={() => {
                          setShowHarmonyReviewsModal(true);
                          setShowProjectReviewsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
                      >
                        <span>⚙️</span>
                        Configure Harmony reviews...
                      </button>
                      <div className="border-t border-slate-100" />
                      <button
                        onClick={() => {
                          setShowProjectReviewsMenu(false);
                          const widgetInfo = {
                            name: 'Project Reviews',
                            type: 'widget',
                            data: 'Project reviews including Harmony and user reviews'
                          };
                          window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
                      >
                        <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
                        Chat with Harmony...
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {/* Harmony Review */}
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                      <img 
                        src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" 
                        alt="Harmony" 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-900">Harmony marked this project</span>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Concerning</span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          Oct 21, 2025 8:15 AM • <span className="text-blue-600 hover:underline cursor-pointer">Delete Review</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          Market analysis shows increasing steel costs and supply chain delays. Recommend reviewing procurement timeline and budget allocation for Q1 2026.
                        </p>
                        <div className="flex gap-1">
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Timeline</span>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Resources</span>
                        </div>
                      </div>
                    </div>

                    {/* Drew Thompson Review */}
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                      <img 
                        src="/images/users/1.png" 
                        alt="Drew Thompson" 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-900">Drew Thompson marked this project</span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">At Risk</span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          Oct 20, 2025 4:46 PM • <span className="text-blue-600 hover:underline cursor-pointer">Delete Review</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          Printer uptime at just 65% (vs. the 90% KPI) and only 8 prototype parts produced per facility (vs. the 20-part target). Immediate action is needed to address equipment delays, training gaps and supply-chain bottlenecks.
                        </p>
                        <div className="flex gap-1">
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">Benefits</span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">Quality of Deliverables</span>
                        </div>
                      </div>
                    </div>

                    {/* George Greene Review */}
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                      <img 
                        src="/images/users/2.png" 
                        alt="George Greene" 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-900">George Greene marked this project</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">On Track</span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          Aug 29, 2025 5:30 PM • <span className="text-blue-600 hover:underline cursor-pointer">Delete Review</span>
                        </div>
                        <p className="text-sm text-slate-700">
                          Our 3D printing project is advancing well, with several prototypes already in production. The next phase involves scaling up and exploring more complex printing capabilities. I'm setting up a training program for our staff to keep them abreast of the latest 3D printing technologies.
                        </p>
                      </div>
                    </div>

                    {/* Paul Waters Review */}
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                      <img 
                        src="/images/users/3.png" 
                        alt="Paul Waters" 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-900">Paul Waters (Project Member) marked this project</span>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Concerning</span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          Oct 19, 2024 3:15 PM • <span className="text-blue-600 hover:underline cursor-pointer">Delete Review</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          Supply chain issues, as well as labor shortages globally may impact our overall execution of this transition to 3D printers. Oversees shipping is unpredictable, and we have a high dependency on highly skilled team members who may not be available when we need them.
                        </p>
                        <div className="flex gap-1">
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Timeline</span>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Stakeholder</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card 
                  title="Net Benefit: target vs. year"
                  onMenuClick={() => setShowNetBenefitMenu(!showNetBenefitMenu)}
                  showMenu={showNetBenefitMenu}
                  menuRef={netBenefitMenuRef}
                  menuContent={
                    <div className="py-1 min-w-[220px]">
                      <button
                        onClick={() => {
                          setShowNetBenefitMenu(false);
                          const widgetInfo = {
                            name: 'Net Benefit',
                            type: 'widget',
                            data: 'Quarterly targets vs actual: Q1 (60% target, 50% actual), Q2 (70% target, 62% actual), Q3 (85% target, 74% actual), Q4 (100% target, 88% actual)'
                          };
                          window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
                      >
                        <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
                        Chat with Harmony...
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-2 text-sm">
                    {[["Q1", 60, 50], ["Q2", 70, 62], ["Q3", 85, 74], ["Q4", 100, 88]].map(([q, target, actual]) => (
                      <div key={String(q)}>
                        <div className="flex justify-between"><span className="font-medium text-slate-700">{String(q)}</span><span className="text-slate-500">Target {Number(target)}% • Actual {Number(actual)}%</span></div>
                        <div className="h-2 bg-slate-200 rounded overflow-hidden relative">
                          <div className="h-2 absolute left-0 top-0" style={{ width: `${Number(target)}%`, background: "#c4b5fd" }} />
                          <div className="h-2 absolute left-0 top-0" style={{ width: `${Number(actual)}%`, background: "#8252A7" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Row 2: Purpose, Scope, Risk Assessment */}
              <div className="grid grid-cols-3 gap-4">
                <Card 
                  title="Purpose"
                  onMenuClick={() => setShowPurposeMenu(!showPurposeMenu)}
                  showMenu={showPurposeMenu}
                  menuRef={purposeMenuRef}
                  menuContent={
                    <div className="py-1 min-w-[220px]">
                      <button
                        onClick={() => {
                          setShowPurposeMenu(false);
                          const widgetInfo = {
                            name: 'Purpose',
                            type: 'widget',
                            data: 'Deliver measurable operational efficiencies across manufacturing sites by consolidating lines and deploying automation'
                          };
                          window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
                      >
                        <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
                        Chat with Harmony...
                      </button>
                    </div>
                  }
                >
                  <p className="text-sm text-slate-700">Deliver measurable operational efficiencies across manufacturing sites by consolidating lines and deploying automation to reduce cycle time and scrap.</p>
                  <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
                    <li>Reduce cycle time by 15% YoY</li>
                    <li>Improve OEE (Overall Equipment Effectiveness) to 82%</li>
                    <li>Standardize reporting cadence across plants</li>
                  </ul>
                </Card>
                  <Card 
                    title="Financial Approvals"
                    onMenuClick={() => setShowFinancialApprovalsMenu(!showFinancialApprovalsMenu)}
                    showMenu={showFinancialApprovalsMenu}
                    menuRef={financialApprovalsMenuRef}
                    menuContent={
                      <div className="py-1 min-w-[220px]">
                        <button
                          onClick={() => {
                            setShowFinancialApprovalsMenu(false);
                            const widgetInfo = {
                              name: 'Financial Approvals',
                              type: 'widget',
                              data: '3 approval gates: Idea ($250k, Approved), Business Case ($1.2M, In Review), Execution ($3.8M, Pending)'
                            };
                            window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
                        >
                          <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
                          Chat with Harmony...
                        </button>
                      </div>
                    }
                  >
                    <div className="overflow-auto">
                      <table className="min-w-[480px] text-sm">
                        <thead style={{ background: "#F6F6F7" }}>
                          <tr className="text-slate-600">
                            <th className="text-left px-3 py-2">Gate</th>
                            <th className="text-left px-3 py-2">Owner</th>
                            <th className="text-left px-3 py-2">Status</th>
                            <th className="text-right px-3 py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Idea", "VP Ops", "Approved", "$250k"],
                            ["Business Case", "CFO", "In Review", "$1.2M"],
                            ["Execution", "PMO", "Pending", "$3.8M"],
                          ].map(([gate, owner, status, amt]) => (
                            <tr key={String(gate)} className="border-t">
                              <td className="px-3 py-2">{String(gate)}</td>
                              <td className="px-3 py-2">{String(owner)}</td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded text-white" style={{ background: status === "Approved" ? "#16a34a" : status === "In Review" ? "#f59e0b" : "#9ca3af" }}>{String(status)}</span>
                              </td>
                              <td className="px-3 py-2 text-right">{String(amt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                <Card 
                  title="Risk Assessment"
                  onMenuClick={() => setShowRiskAssessmentMenu(!showRiskAssessmentMenu)}
                  showMenu={showRiskAssessmentMenu}
                  menuRef={riskAssessmentMenuRef}
                  menuContent={
                    <div className="py-1 min-w-[220px]">
                      <button
                        onClick={() => {
                          setShowRiskAssessmentMenu(false);
                          const widgetInfo = {
                            name: 'Risk Assessment',
                            type: 'widget',
                            data: '4 risks identified: Equipment Lead Times (High), Budget Variance (Medium), Change Management (Medium), Supplier Dependency (Low)'
                          };
                          window.dispatchEvent(new CustomEvent('discussWithHarmony', { detail: widgetInfo }));
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2"
                      >
                        <img src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" alt="Harmony" className="w-4 h-4" />
                        Chat with Harmony...
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-3">
                    {[
                      { risk: "Equipment Lead Times", level: "High", impact: "Schedule delay potential", color: "#f59e0b" },
                      { risk: "Budget Variance", level: "Medium", impact: "Cost overrun risk", color: "#f97316" },
                      { risk: "Change Management", level: "Medium", impact: "Adoption challenges", color: "#f97316" },
                      { risk: "Supplier Dependency", level: "Low", impact: "Minimal impact", color: "#16a34a" }
                    ].map(item => (
                      <div key={item.risk} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800 text-sm">{item.risk}</div>
                          <div className="text-xs text-slate-500">{item.impact}</div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded font-medium text-white" style={{ background: item.color }}>
                          {item.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Bottom rows: Financial Approvals + Guidance (left 2 cols) and Ask Harmony (right, spans 2 rows) */}
              <div className="grid grid-cols-3 gap-4">
                <ActivityFeedWidget />
                <div className="h-full overflow-visible">
                  <AskHarmonyBoxWithMenu />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Global Scenario Planner Modal */}
        <ScenarioPlanner 
          open={scenarioOpen} 
          onClose={() => setScenarioOpen(false)}
          onAddToChat={() => {
            // This will be handled by the HarmonySidebar component
            // We'll use a global event or callback approach
            window.dispatchEvent(new CustomEvent('addScenarioToChat'));
            setScenarioOpen(false);
          }}
        />

        {/* Harmony Reviews Configuration Modal */}
        {showHarmonyReviewsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 main-harmony-modal-overlay">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Configure Harmony Reviews</h2>
                <button
                  onClick={() => setShowHarmonyReviewsModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="space-y-6">
                  {/* Base Review Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Base Review Frequency</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Daily</option>
                      <option defaultValue="selected">Weekly</option>
                      <option>Bi-weekly</option>
                      <option>Monthly</option>
                    </select>
                    <p className="text-sm text-slate-500 mt-1">How often should Harmony review projects under normal conditions?</p>
                  </div>

                  {/* Timeline-Based Rules */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Timeline-Based Adjustments</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="main-timeline-rule" className="rounded" defaultChecked />
                        <label htmlFor="main-timeline-rule" className="flex-1 text-sm">
                          Increase frequency when projects are within
                          <select className="mx-2 px-2 py-1 border border-slate-300 rounded text-sm">
                            <option>1 month</option>
                            <option defaultValue="selected">2 months</option>
                            <option>3 months</option>
                            <option>6 months</option>
                          </select>
                          of their deadline
                        </label>
                      </div>
                      <div className="ml-6">
                        <label className="text-sm text-slate-600">Review frequency when approaching deadline:</label>
                        <select className="ml-2 px-2 py-1 border border-slate-300 rounded text-sm">
                          <option>Daily</option>
                          <option defaultValue="selected">Weekly</option>
                          <option>Bi-weekly</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Risk-Based Rules */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Risk and Issue-Based Adjustments</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="main-risk-rule" className="rounded" defaultChecked />
                        <label htmlFor="main-risk-rule" className="flex-1 text-sm">
                          Increase frequency when projects have
                          <select className="mx-2 px-2 py-1 border border-slate-300 rounded text-sm">
                            <option>1+</option>
                            <option defaultValue="selected">3+</option>
                            <option>5+</option>
                            <option>10+</option>
                          </select>
                          high-priority risks or issues
                        </label>
                      </div>
                      <div className="ml-6">
                        <label className="text-sm text-slate-600">Review frequency for high-risk projects:</label>
                        <select className="ml-2 px-2 py-1 border border-slate-300 rounded text-sm">
                          <option>Daily</option>
                          <option defaultValue="selected">Weekly</option>
                          <option>Bi-weekly</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Status-Based Rules */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Status-Based Adjustments</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="main-status-rule" className="rounded" defaultChecked />
                        <label htmlFor="main-status-rule" className="text-sm">
                          Increase frequency for projects with "At Risk" or "Concerning" status
                        </label>
                      </div>
                      <div className="ml-6">
                        <label className="text-sm text-slate-600">Review frequency for concerning projects:</label>
                        <select className="ml-2 px-2 py-1 border border-slate-300 rounded text-sm">
                          <option defaultValue="selected">Daily</option>
                          <option>Weekly</option>
                          <option>Bi-weekly</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* KPI Performance Rules */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">KPI Performance Adjustments</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="main-kpi-rule" className="rounded" defaultChecked />
                        <label htmlFor="main-kpi-rule" className="flex-1 text-sm">
                          Increase frequency when projects are
                          <select className="mx-2 px-2 py-1 border border-slate-300 rounded text-sm">
                            <option>5%</option>
                            <option>10%</option>
                            <option defaultValue="selected">15%</option>
                            <option>20%</option>
                          </select>
                          or more off from KPI targets
                        </label>
                      </div>
                      <div className="ml-6">
                        <label className="text-sm text-slate-600">Review frequency for underperforming projects:</label>
                        <select className="ml-2 px-2 py-1 border border-slate-300 rounded text-sm">
                          <option>Daily</option>
                          <option defaultValue="selected">Weekly</option>
                          <option>Bi-weekly</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Review Categories */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Review Categories</label>
                    <p className="text-sm text-slate-500 mb-3">Select which areas Harmony should focus on during reviews:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {['Benefits', 'Scope', 'Timeline', 'Stakeholder', 'Team', 'Resources', 'Quality of Deliverables'].map((category) => (
                        <label key={category} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-sm">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Summary Preview */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Review Schedule Preview</h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>• <strong>Normal projects:</strong> Weekly reviews</p>
                      <p>• <strong>Approaching deadline (within 2 months):</strong> Weekly reviews</p>
                      <p>• <strong>High-risk projects (3+ issues):</strong> Weekly reviews</p>
                      <p>• <strong>At Risk/Concerning status:</strong> Daily reviews</p>
                      <p>• <strong>Underperforming (15%+ off KPIs):</strong> Weekly reviews</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => setShowHarmonyReviewsModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Connect Modal */}
        <MobileConnectModal 
          open={showMobileConnectModal} 
          onClose={() => setShowMobileConnectModal(false)}
        />

      </div>
    </div>
  );
}

export default App;
