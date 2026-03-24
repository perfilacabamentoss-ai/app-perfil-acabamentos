
export const STORAGE_KEYS = [
  'perfil_works',
  'perfil_medicoes',
  'perfil_payments',
  'perfil_faturas',
  'perfil_collaborators',
  'perfil_suppliers',
  'perfil_contractors',
  'perfil_materials',
  'perfil_qr_gallery',
  'perfil_stages',
  'perfil_best_prices',
  'perfil_projects',
  'perfil_notification_settings',
  'perfil_main_balance',
  'perfil_contractor_work_filter',
  'perfil_collab_work_filter',
  'perfil_propostas',
  'perfil_imported_projects',
  'perfil_marketplace_professionals',
  'perfil_marketplace_clients',
  'perfil_marketplace_requests',
  'perfil_marketplace_messages',
  'perfil_marketplace_feedbacks',
  'perfil_marketplace_specialties',
  'perfil_producao',
  'perfil_access_logs',
  'perfil_access_users',
  'perfil_user',
  'perfil_user_roles'
];

export const clearAllSystemData = () => {
  if (window.confirm("ATENÇÃO EXTREMA: Isso apagará TODOS os dados do sistema (Obras, Financeiro, Equipes, Suprimentos). Esta ação NÃO pode ser desfeita sem o token de recuperação. Deseja continuar?")) {
    // Create backup before clearing
    const backup: Record<string, string | null> = {};
    STORAGE_KEYS.forEach(key => {
      backup[key] = localStorage.getItem(key);
    });
    localStorage.setItem('perfil_system_backup', JSON.stringify(backup));
    localStorage.setItem('perfil_backup_date', new Date().toISOString());

    STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    alert("Sistema reiniciado com sucesso. A página será recarregada.");
    window.location.reload();
  }
};

export const restoreSystemData = () => {
  const backupStr = localStorage.getItem('perfil_system_backup');
  if (!backupStr) {
    alert("Nenhum backup encontrado.");
    return;
  }

  const backup = JSON.parse(backupStr);
  Object.entries(backup).forEach(([key, value]) => {
    if (value !== null) {
      localStorage.setItem(key, value as string);
    }
  });
  
  alert("Dados restaurados com sucesso! A página será recarregada.");
  window.location.reload();
};

export const getDailyToken = () => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  // Simple deterministic token based on date
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash) + date.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().substring(0, 6);
};
