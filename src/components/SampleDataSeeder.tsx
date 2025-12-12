import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Loader2, Database, FileCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Sample Data Seeder Component
 * 
 * This component provides a UI to populate sample data for testing
 * the Self Assessment Report feature.
 * 
 * Usage:
 * 1. Import this component in your dashboard or settings page
 * 2. User must be logged in
 * 3. Click "Populate Sample Data" to create test data
 * 4. View the generated report
 */

export function SampleDataSeeder() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  const seedSampleData = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');
    setDetails(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session. Please log in first.');
      }

      // Call the seeding endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/seed/populate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Failed to seed data');
      }

      const result = await response.json();
      
      setStatus('success');
      setMessage('Sample data populated successfully!');
      setDetails(result.data);
      
    } catch (error: any) {
      console.error('Error seeding sample data:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to populate sample data');
    } finally {
      setLoading(false);
    }
  };

  const clearSampleData = async () => {
    if (!confirm('Are you sure you want to delete all your assets, tax calculations, and documents? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session. Please log in first.');
      }

      // Delete data using Supabase client
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Delete in correct order to avoid foreign key violations
      await supabase.from('documents').delete().eq('user_id', user.id);
      await supabase.from('tax_calculations').delete().eq('user_id', user.id);
      await supabase.from('assets').delete().eq('user_id', user.id);

      setStatus('success');
      setMessage('Sample data cleared successfully');
      setDetails(null);

    } catch (error: any) {
      console.error('Error clearing sample data:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to clear sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 rounded-lg border border-[#00d9ff]/20 bg-gradient-to-br from-[#00d9ff]/5 to-transparent">
        <Database className="size-6 text-[#00d9ff] shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg mb-2">Sample Data Generator</h3>
          <p className="text-sm text-gray-400">
            Generate realistic sample data for testing the Self Assessment Report feature.
            This will create 4 overseas assets, tax calculations, and documents.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={seedSampleData}
          disabled={loading}
          className="bg-gradient-to-r from-[#00d9ff] to-[#a855f7] hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileCheck className="size-4 mr-2" />
              Populate Sample Data
            </>
          )}
        </Button>

        <Button
          onClick={clearSampleData}
          disabled={loading}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          Clear All Data
        </Button>
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-emerald-400 mb-1">{message}</p>
            {details && (
              <div className="text-sm text-gray-400 space-y-1 mt-2">
                <p>• Created {details.assets?.length || 0} assets</p>
                <p>• Created tax calculation for {details.taxCalculation?.tax_year}</p>
                <p>• Total asset value: £{details.assets?.reduce((sum: number, a: any) => sum + a.value_gbp, 0).toLocaleString()}</p>
                <p>• Balance due: £{details.taxCalculation?.amount_due_by_31jan?.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400">{message}</p>
            <p className="text-sm text-gray-400 mt-2">
              Make sure you've run the database schema from <code className="px-1 py-0.5 rounded bg-gray-800">/database-schema.sql</code> in your Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* Sample Data Preview */}
      <div className="p-6 rounded-lg border border-gray-800 bg-[#0a0a0f]/50">
        <h4 className="text-sm mb-3 text-gray-400">What gets created:</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <div className="size-1.5 rounded-full bg-[#00d9ff] shrink-0 mt-2" />
            <span>
              <strong className="text-gray-300">4 Overseas Assets:</strong> Properties in Spain & UAE, 
              US Investment Portfolio, Singapore Bank Account (Total: £482,000)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <div className="size-1.5 rounded-full bg-[#a855f7] shrink-0 mt-2" />
            <span>
              <strong className="text-gray-300">Tax Calculation for 2024/2025:</strong> £106,250 total income, 
              £36,158 UK tax liability, £11,443 balance due
            </span>
          </li>
          <li className="flex items-start gap-2">
            <div className="size-1.5 rounded-full bg-[#00d9ff] shrink-0 mt-2" />
            <span>
              <strong className="text-gray-300">DTA Analysis:</strong> Double taxation relief for Spain (£1,845), 
              USA (£530), UAE, and Singapore
            </span>
          </li>
          <li className="flex items-start gap-2">
            <div className="size-1.5 rounded-full bg-[#a855f7] shrink-0 mt-2" />
            <span>
              <strong className="text-gray-300">3 Sample Documents:</strong> Spanish rental income statement, 
              US 1099-DIV form, Dubai rental agreement
            </span>
          </li>
          <li className="flex items-start gap-2">
            <div className="size-1.5 rounded-full bg-[#00d9ff] shrink-0 mt-2" />
            <span>
              <strong className="text-gray-300">AI Insights:</strong> 6 personalized tax optimization 
              recommendations and compliance checks
            </span>
          </li>
        </ul>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> After generating sample data, navigate to the Self Assessment Report 
          page to view the comprehensive report with all tax calculations, DTA analysis, and compliance checks.
        </p>
      </div>
    </div>
  );
}
