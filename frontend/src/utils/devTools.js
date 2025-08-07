/**
 * Development and testing utilities
 */

/**
 * Hook to log component lifecycle and props changes
 */
export function useDevLogger(componentName, props = {}) {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  renderCount.current++;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered (${renderCount.current})`);
      
      // Log prop changes
      const changedProps = {};
      Object.keys(props).forEach(key => {
        if (prevProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: prevProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`📝 ${componentName} props changed:`, changedProps);
      }

      prevProps.current = props;
    }
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${componentName} mounted`);
      return () => {
        console.log(`💀 ${componentName} unmounted`);
      };
    }
  }, [componentName]);
}

/**
 * Mock data generator for development
 */
export const MockDataGenerator = {
  /**
   * Generate mock journal entries
   */
  generateJournalEntries(count = 10) {
    const titles = [
      'Morning Reflections',
      'Weekend Adventures',
      'Work Thoughts',
      'Creative Inspiration',
      'Daily Gratitude',
      'Learning Journey',
      'Personal Growth',
      'Random Musings',
      'Life Updates',
      'Future Plans',
    ];

    const statuses = ['draft', 'complete'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-${i + 1}`,
      title: titles[i % titles.length] + ` ${i + 1}`,
      content: `# ${titles[i % titles.length]} ${i + 1}\n\nThis is mock content for testing purposes. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\n## Section\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris.`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },

  /**
   * Generate mock chat messages
   */
  generateChatMessages(count = 5) {
    const messages = [
      'What did I write about yesterday?',
      'Tell me about my recent thoughts on productivity',
      'What are my main concerns lately?',
      'Show me entries about goals',
      'What patterns do you see in my writing?',
    ];

    const responses = [
      'Based on your recent entries, you wrote about...',
      'Your productivity thoughts focus on...',
      'Your main concerns seem to be...',
      'Here are your goal-related entries...',
      'I notice these patterns in your writing...',
    ];

    return Array.from({ length: count }, (_, i) => [
      {
        role: 'user',
        content: messages[i % messages.length],
        timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      },
      {
        role: 'assistant',
        content: responses[i % responses.length],
        timestamp: new Date(Date.now() - (count - i) * 60000 + 30000).toISOString(),
      },
    ]).flat();
  },

  /**
   * Generate mock topics
   */
  generateTopics(count = 6) {
    const topics = [
      'productivity',
      'relationships',
      'career growth',
      'health & wellness',
      'creative projects',
      'learning & education',
      'financial planning',
      'travel experiences',
      'personal challenges',
      'future aspirations',
    ];

    return Array.from({ length: count }, (_, i) => ({
      topic: topics[i % topics.length],
      frequency: Math.floor(Math.random() * 20) + 5,
      lastMention: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },
};

/**
 * Feature flag system for development
 */
export class FeatureFlags {
  constructor() {
    this.flags = new Map();
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        const flags = JSON.parse(stored);
        Object.entries(flags).forEach(([key, value]) => {
          this.flags.set(key, value);
        });
      }
    } catch (error) {
      console.warn('Failed to load feature flags:', error);
    }
  }

  saveToStorage() {
    try {
      const flags = Object.fromEntries(this.flags);
      localStorage.setItem('featureFlags', JSON.stringify(flags));
    } catch (error) {
      console.warn('Failed to save feature flags:', error);
    }
  }

  set(flag, enabled) {
    this.flags.set(flag, enabled);
    this.saveToStorage();
  }

  get(flag, defaultValue = false) {
    return this.flags.get(flag) ?? defaultValue;
  }

  toggle(flag) {
    const current = this.get(flag);
    this.set(flag, !current);
    return !current;
  }

  getAll() {
    return Object.fromEntries(this.flags);
  }

  clear() {
    this.flags.clear();
    this.saveToStorage();
  }
}

// Global feature flags instance
export const featureFlags = new FeatureFlags();

/**
 * Development tools panel component
 */
export function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700"
        title="Toggle Dev Tools"
      >
        🛠️
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-[9998] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl w-96 max-h-80 overflow-hidden">
          {/* Header */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['performance', 'flags', 'mock'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm capitalize ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {activeTab === 'performance' && <PerformanceTab />}
            {activeTab === 'flags' && <FeatureFlagsTab />}
            {activeTab === 'mock' && <MockDataTab />}
          </div>
        </div>
      )}
    </>
  );
}

function PerformanceTab() {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(() => {
      setMetrics(performanceMonitor.getAllMetrics());
    });
    
    setMetrics(performanceMonitor.getAllMetrics());
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Performance Metrics</h3>
      {Object.entries(metrics).map(([name, metric]) => (
        <div key={name} className="text-xs">
          <div className="font-medium">{name}</div>
          <div className="text-gray-600 dark:text-gray-400">
            Avg: {Math.round(metric.average)}ms, Count: {metric.count}
          </div>
        </div>
      ))}
      <button
        onClick={() => BundleAnalyzer.logBundleInfo()}
        className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
      >
        Log Bundle Info
      </button>
    </div>
  );
}

function FeatureFlagsTab() {
  const [flags, setFlags] = useState(featureFlags.getAll());

  const toggleFlag = (flag) => {
    featureFlags.toggle(flag);
    setFlags(featureFlags.getAll());
  };

  const addFlag = () => {
    const name = prompt('Flag name:');
    if (name) {
      featureFlags.set(name, false);
      setFlags(featureFlags.getAll());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Feature Flags</h3>
        <button
          onClick={addFlag}
          className="text-xs bg-green-500 text-white px-2 py-1 rounded"
        >
          Add
        </button>
      </div>
      {Object.entries(flags).map(([flag, enabled]) => (
        <div key={flag} className="flex justify-between items-center">
          <span className="text-sm">{flag}</span>
          <button
            onClick={() => toggleFlag(flag)}
            className={`text-xs px-2 py-1 rounded ${
              enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}
    </div>
  );
}

function MockDataTab() {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Mock Data</h3>
      <button
        onClick={() => console.log('Mock entries:', MockDataGenerator.generateJournalEntries(5))}
        className="block w-full text-left text-xs bg-blue-500 text-white px-2 py-1 rounded mb-2"
      >
        Generate Journal Entries
      </button>
      <button
        onClick={() => console.log('Mock messages:', MockDataGenerator.generateChatMessages(10))}
        className="block w-full text-left text-xs bg-blue-500 text-white px-2 py-1 rounded mb-2"
      >
        Generate Chat Messages
      </button>
      <button
        onClick={() => console.log('Mock topics:', MockDataGenerator.generateTopics())}
        className="block w-full text-left text-xs bg-blue-500 text-white px-2 py-1 rounded"
      >
        Generate Topics
      </button>
    </div>
  );
}
