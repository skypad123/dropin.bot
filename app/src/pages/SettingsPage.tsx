import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile'|'security'|'notifications'|'billing'|'account'>('profile');
  const tabs = ['profile','security','notifications','billing','account'];
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-20 px-6 lg:px-10 h-16 flex items-center justify-between" style={{ background: 'var(--bg-primary)' }}>
        <div>
          <p className="section-label mb-0">preferences</p>
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        </div>
      </div>
      <div className="px-6 lg:px-10 pb-12 flex flex-col lg:flex-row">
        <div className="w-full lg:w-48 mb-4 lg:mb-0">
          <div className="flex flex-col space-y-1">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t as 'profile'|'security'|'notifications'|'billing'|'account')} className="text-left px-3 py-2 rounded-md font-medium"
                style={{
                  background: activeTab===t ? 'rgba(192,86,64,0.10)' : 'transparent',
                  color: activeTab===t ? 'var(--burnt-orange)' : 'var(--text-primary)'
                }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-6 lg:p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--burnt-orange)', color: 'white', fontFamily: 'Space Grotesk' }}>{user?.name?.[0] ?? 'U'}</div>
                <div>
                  <p className="font-display font-bold text-lg">{user?.name}</p>
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email} <span className="ml-1 px-1.5 py-0.5 text-xs rounded" style={{ background: 'rgba(45,125,70,0.12)', color: '#2D7D46' }}>verified</span></p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="section-label mb-1">Full Name</label>
                  <input className="form-input" defaultValue={user?.name} />
                </div>
                <div>
                  <label className="section-label mb-1">Phone</label>
                  <input className="form-input" placeholder="+1 555 000 0000" />
                </div>
                <div className="md:col-span-2">
                  <label className="section-label mb-1">Bio</label>
                  <textarea className="form-input" rows={3} placeholder="Tell us about yourself..." />
                </div>
              </div>
              <button className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient">
                Save Changes
              </button>
            </div>
          )}
          {activeTab === 'security' && (
            <div>
              <p className="section-label mb-1">Change Password</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="form-input" type="password" placeholder="Current password" />
                <input className="form-input" type="password" placeholder="New password" />
                <input className="form-input" type="password" placeholder="Confirm password" />
              </div>
              <button className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient">
                Update Password
              </button>
              <div className="mt-6">
                <p className="section-label mb-1">Two‑Factor Authentication</p>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>Enable 2FA for extra security</p>
                  </div>
                  <button className="w-11 h-6 rounded-full" style={{ background: 'var(--border-color)' }}>
                    <span className="block w-5 h-5 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'notifications' && (
            <div>
              {['Email Digests','Conversation Alerts','Usage Warnings','Security Alerts','Product Updates'].map(item => (
                <div key={item} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <p className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>{item}</p>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>Enable to receive {item.toLowerCase()}</p>
                  </div>
                  <button className="w-11 h-6 rounded-full" style={{ background: 'var(--border-color)' }}>
                    <span className="block w-5 h-5 bg-white rounded-full shadow" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'billing' && (
            <div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Current Plan</p>
                <h2 className="font-display font-bold text-xl">Pro Plan</h2>
                <ul className="list-disc pl-5 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li>Unlimited instances</li>
                  <li>Priority support</li>
                  <li>Advanced analytics</li>
                </ul>
                <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white brand-gradient">
                  Upgrade
                </button>
              </div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Usage</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div className="h-full" style={{ width: '70%', background: 'var(--burnt-orange)' }} />
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--text-primary)' }}>70%</span>
                </div>
                <p className="font-body text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Conversations used / limit</p>
              </div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Payment Method</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm">Visa ending 4242</span>
                  </div>
                  <button className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Update</button>
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p className="section-label mb-1">Billing History</p>
                <ul className="space-y-2">
                  {[{date:'2024-04-01',amount:49.99},{date:'2024-03-01',amount:49.99},{date:'2024-02-01',amount:49.99}].map((inv,i)=>(
                    <li key={i} className="flex items-center justify-between">
                      <span className="font-body text-sm">{inv.date}</span>
                      <span className="font-body text-sm">${inv.amount}</span>
                      <button className="text-sm font-medium underline" style={{ color: 'var(--burnt-orange)' }}>Download</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'account' && (
            <div>
              <div className="rounded-2xl p-5 mb-4 border border-red-600" style={{ background: 'var(--bg-primary)' }}>
                <p className="section-label mb-1" style={{ color: '#DC2626' }}>Delete Account</p>
                <p className="font-body text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>This action cannot be undone. All data will be lost.</p>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-red-600 hover:-translate-y-0.5" style={{ boxShadow: '0 4px 12px rgba(220,38,38,0.25)' }}>
                  Delete Account
                </button>
              </div>
              <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white brand-gradient">
                Export Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
