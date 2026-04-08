import { useNavigate } from 'react-router';
import { Building2, Users, Shield, UserCheck, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';

const roles = [
  {
    key: 'resident',
    label: 'Resident',
    description: 'Access your complaints, notices & community updates',
    icon: Users,
  },
  {
    key: 'committee_member',
    label: 'Committee Member',
    description: 'Manage complaints and communicate with residents',
    icon: UserCheck,
  },
  {
    key: 'manager',
    label: 'Property Manager',
    description: 'View and resolve complaints assigned to you',
    icon: ClipboardList,
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Full access to manage society, users & settings',
    icon: Shield,
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();

  const handleSelect = (role: string) => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f1f35 0%, #1D3557 30%, #1a3a5c 60%, #0d2240 100%)',
      }}
    >
      {/* Mesh gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #2DE2E6 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3A6EA5 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2DE2E6, #3A6EA5)' }}
            >
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Society Hub</h1>
            <p className="text-white/50">Select your role to continue</p>
          </div>

          <div className="space-y-2">
            {roles.map(({ key, label, description, icon: Icon }, i) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(key)}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(45,226,230,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(45,226,230,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.10)';
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(45,226,230,0.3), rgba(58,110,165,0.3))' }}
                >
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-white">{label}</p>
                  <p className="text-sm text-white/50">{description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
