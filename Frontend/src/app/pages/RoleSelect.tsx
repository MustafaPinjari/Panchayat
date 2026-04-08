import { useNavigate } from 'react-router';
import { Building2, Users, Shield, UserCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">Society Hub</h1>
            <p className="text-muted-foreground">Select your role to continue</p>
          </div>

          <div className="space-y-3">
            {roles.map(({ key, label, description, icon: Icon }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(key)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
