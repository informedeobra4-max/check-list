/**
 * Directorio de contratistas y responsables técnicos con avatares de alta calidad,
 * roles asignados y paleta visual estilo Dribbble.
 */

export interface ContractorProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  color: string;
  initials: string;
}

export const DEFAULT_CONTRACTORS: ContractorProfile[] = [
  {
    id: 'c_arrieta',
    name: 'Msc. Arq. Agustín Arrieta',
    role: 'Director de Obra',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#00f2fe',
    initials: 'AA'
  },
  {
    id: 'c_carter',
    name: 'Liam Carter',
    role: 'Capataz General de Obra',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#818cf8',
    initials: 'LC'
  },
  {
    id: 'c_mitchell',
    name: 'Noah Mitchell',
    role: 'Instalaciones Sanitarias & Gas',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#38bdf8',
    initials: 'NM'
  },
  {
    id: 'c_thompson',
    name: 'Ava Thompson',
    role: 'Estructuras H°A° & Armaduras',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    color: '#34d399',
    initials: 'AT'
  },
  {
    id: 'c_robinson',
    name: 'Mia Robinson',
    role: 'Control de Calidad & QA',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    color: '#fb7185',
    initials: 'MR'
  },
  {
    id: 'c_morgan',
    name: 'Lucas Morgan',
    role: 'Electricidad & Acometidas',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    color: '#f59e0b',
    initials: 'LM'
  },
  {
    id: 'c_adams',
    name: 'Sophia Adams',
    role: 'Carpintería & Terminaciones',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    color: '#a855f7',
    initials: 'SA'
  },
  {
    id: 'c_crown',
    name: 'Justin Crown',
    role: 'Cómputo & Certificaciones',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    color: '#ec4899',
    initials: 'JC'
  }
];

/**
 * Obtiene el perfil de un contratista/responsable a partir de su nombre.
 * Si no coincide con ninguno predefinido, genera un perfil dinámico consistente con iniciales.
 */
export function getContractorProfile(name?: string, fallbackRole?: string): ContractorProfile {
  if (!name || !name.trim()) {
    return {
      id: 'c_default',
      name: 'Sin Asignar',
      role: fallbackRole || 'Responsable General',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      color: '#94a3b8',
      initials: 'SA'
    };
  }

  const cleanName = name.trim().toLowerCase();
  const found = DEFAULT_CONTRACTORS.find(c =>
    cleanName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(cleanName)
  );

  if (found) {
    return {
      ...found,
      role: fallbackRole || found.role
    };
  }

  // Generar iniciales
  const parts = name.trim().split(' ').filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.substring(0, 2) || 'OB').toUpperCase();

  // Generar color basado en hash del nombre
  const colors = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#fb7185', '#a855f7', '#00f2fe', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  // Avatares rotativos elegantes
  const fallbackAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  ];
  const avatarUrl = fallbackAvatars[Math.abs(hash) % fallbackAvatars.length];

  return {
    id: `c_${Math.abs(hash)}`,
    name: name.trim(),
    role: fallbackRole || 'Técnico de Obra',
    avatarUrl,
    color,
    initials
  };
}
