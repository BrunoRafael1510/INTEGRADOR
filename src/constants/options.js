export const SUPPORT_CATEGORIES = [
  'Ansiedade',
  'Depressao',
  'Familia',
  'Relacionamentos',
  'Trabalho',
  'Estudos',
  'Solidao',
  'Luto',
  'Autoestima',
  'Trauma',
  'Burnout',
  'Outros',
]

export const CATEGORY_FILTERS = ['Todas', ...SUPPORT_CATEGORIES]

export const SPECIALTY_OPTIONS = [
  'Psicologia clinica',
  'Psicoterapia',
  'Psicologia infantil',
  'Psicologia adolescente',
  'Psicologia familiar',
  'Psicologia organizacional',
  'Neuropsicologia',
  'Psicopedagogia',
  'Psiquiatria',
  'Terapia ocupacional',
]

export const PROFESSIONAL_AREA_OPTIONS = [
  'Ansiedade',
  'Depressao',
  'Relacionamentos',
  'Familia',
  'Trabalho',
  'Estudos',
  'Autoestima',
  'Luto',
  'Trauma',
  'Burnout',
  'Estresse',
  'Dependencia emocional',
  'Orientacao profissional',
  'Terapia de casal',
  'Adolescencia',
  'Acolhimento LGBTQIAPN+',
]

export const DIRECTORY_AREA_FILTERS = ['Todas', ...SPECIALTY_OPTIONS, ...PROFESSIONAL_AREA_OPTIONS]

export const LANGUAGE_OPTIONS = ['Portugues', 'Ingles', 'Espanhol', 'Libras', 'Frances', 'Italiano']

export const FORMATION_OPTIONS = [
  'Graduacao em Psicologia',
  'Graduacao em Medicina com residencia em Psiquiatria',
  'Pos-graduacao em Psicologia Clinica',
  'Especializacao em Terapia Cognitivo-Comportamental',
  'Especializacao em Psicanalise',
  'Especializacao em Terapia Familiar',
  'Mestrado',
  'Doutorado',
]

export const EXPERIENCE_OPTIONS = [
  'Menos de 1 ano',
  '1 a 3 anos',
  '3 a 5 anos',
  '5 a 10 anos',
  'Mais de 10 anos',
]

export const CERTIFICATION_OPTIONS = [
  'CRP ativo',
  'Atendimento online autorizado',
  'Terapia Cognitivo-Comportamental',
  'Psicanalise',
  'Terapia Sistemica',
  'Terapia de Casal',
  'Neuropsicologia',
  'Intervencao em crise',
  'Primeiros cuidados psicologicos',
  'Saude mental no trabalho',
]

export const AVAILABILITY_OPTIONS = [
  'Manha',
  'Tarde',
  'Noite',
  'Segunda a sexta',
  'Finais de semana',
  'Horarios flexiveis',
  'Atendimento emergencial sob consulta',
]

export const SERVICE_MODALITIES = ['Online', 'Presencial', 'Online e presencial']

export const REQUEST_STATUS = ['nova', 'pendente', 'aceita', 'recusada', 'finalizada']
