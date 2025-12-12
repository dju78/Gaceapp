import { useState } from 'react';
import { Play, Trash2, Users, Info } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface DemoUser {
  email: string;
  password: string;
  scenario: string;
  assetsCreated: number;
}

export function DemoDataManager() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<DemoUser[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8`;

  const seedDemoData = async () => {
    try {
      setIsSeeding(true);
      setMessage('');
      setResults([]);

      const response = await fetch(`${serverUrl}/demo/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Demo data seeded successfully!');
        setResults(data.results || []);
        setShowCredentials(true);
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to seed demo data'}`);
      }
    } catch (error) {
      console.error('Error seeding demo data:', error);
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const clearDemoData = async () => {
    if (!confirm('Are you sure you want to clear all demo data?')) {
      return;
    }

    try {
      setIsClearing(true);
      setMessage('');
      setResults([]);

      const response = await fetch(`${serverUrl}/demo/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Demo data cleared successfully!');
        setShowCredentials(false);
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to clear demo data'}`);
      }
    } catch (error) {
      console.error('Error clearing demo data:', error);
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-cyan-400" />
            <h1 className="text-white">GACE Demo Data Manager</h1>
          </div>
          <p className="text-white/60">
            Seed demo user accounts with realistic scenarios for presentation and testing.
          </p>
        </div>

        {/* Actions */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={seedDemoData}
              disabled={isSeeding}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
            </button>
            <button
              onClick={clearDemoData}
              disabled={isClearing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-400 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              {isClearing ? 'Clearing...' : 'Clear Demo Data'}
            </button>
          </div>

          {message && (
            <div className="mt-4 p-4 bg-white/10 rounded-lg text-white">
              {message}
            </div>
          )}
        </div>

        {/* Demo Credentials */}
        {showCredentials && results.length > 0 && (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-cyan-400" />
              <h2 className="text-white">Demo User Credentials</h2>
            </div>
            <p className="text-white/60 mb-6">
              All demo accounts use password: <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">Demo123!</code>
            </p>

            <div className="space-y-3">
              {results.map((user, idx) => (
                <div
                  key={user.email}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-cyan-400">#{idx + 1}</span>
                        <span className="text-white">{user.email}</span>
                      </div>
                      <p className="text-white/60 text-sm mb-2">{user.scenario}</p>
                      <p className="text-white/40 text-sm">
                        {user.assetsCreated} overseas asset{user.assetsCreated !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.email);
                          alert('Email copied to clipboard!');
                        }}
                        className="text-xs bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-all text-white"
                      >
                        Copy Email
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('Demo123!');
                          alert('Password copied to clipboard!');
                        }}
                        className="text-xs bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-all text-white"
                      >
                        Copy Password
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <h3 className="text-white mb-2">Demo User Scenarios:</h3>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• UK Expat with US Property Portfolio - Complex multi-asset scenario</li>
                <li>• Multi-Jurisdiction Investment Portfolio - Global diversification</li>
                <li>• Business Owner with International Operations - UAE business focus</li>
                <li>• Tax Advisor - Professional user managing clients</li>
                <li>• Retiree with Overseas Pensions - France & Canada pensions</li>
                <li>• Simple Case - Single overseas bank account</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
