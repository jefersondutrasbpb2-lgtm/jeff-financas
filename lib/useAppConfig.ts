import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface AppConfig {
  // Identidade do app (interno)
  app_name: string;
  logo_url: string;             // ícone do app
  app_logotype_url: string;     // logomarca do app (texto/imagem ao lado do ícone)
  // Welcome screen (separado do app interno)
  welcome_icon_url: string;     // ícone da welcome
  logotype_image_url: string;   // logomarca da welcome
  // Fallback nome
  welcome_logotype_name: string;
  // Fundo
  bg_color_1: string;
  bg_color_2: string;
  bg_color_3: string;
  bg_image_url: string;
  // Cor de destaque
  accent_color: string;
  // Textos da welcome
  welcome_tagline: string;
  welcome_headline: string;
  welcome_body: string;
  welcome_cta_primary: string;
  // UI
  show_preview_card: string;
  // Tamanhos (números como string)
  app_logo_size: string;
  welcome_hero_logo_size: string;
  welcome_brand_logo_size: string;
  welcome_headline_size: string;
  welcome_body_size: string;
  welcome_tagline_size: string;
  welcome_cta_size: string;
}

export const DEFAULTS: AppConfig = {
  app_name: 'Jefin',
  logo_url: '',
  app_logotype_url: '',
  welcome_icon_url: '/welcome-icon.svg',
  logotype_image_url: '/logotype.svg',
  welcome_logotype_name: 'Jefin',
  bg_color_1: '#051228',
  bg_color_2: '#071A3A',
  bg_color_3: '#061535',
  bg_image_url: '',
  accent_color: '#00B894',
  welcome_tagline: 'SEU DINHEIRO EM ORDEM',
  welcome_headline: 'Organize. Planeje. Conquiste.',
  welcome_body: 'Controle suas finanças, registre pelo Telegram e acompanhe cada centavo do seu dinheiro.',
  welcome_cta_primary: 'Começar agora',
  show_preview_card: 'true',
  app_logo_size: '36',
  welcome_hero_logo_size: '80',
  welcome_brand_logo_size: '40',
  welcome_headline_size: '30',
  welcome_body_size: '14',
  welcome_tagline_size: '10',
  welcome_cta_size: '15',
};

export function useAppConfig() {
  return useQuery({
    queryKey: ['app_config'],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<AppConfig> => {
      const { data, error } = await supabase.from('app_config').select('key, value');
      if (error || !data) return DEFAULTS;
      const map: Record<string, string> = {};
      for (const row of data) map[row.key] = row.value ?? '';
      return { ...DEFAULTS, ...map };
    },
  });
}

export function useUpdateAppConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<AppConfig>) => {
      const rows = Object.entries(updates).map(([key, value]) => ({
        key,
        value: value ?? '',
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('app_config')
        .upsert(rows, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_config'] }),
  });
}

export async function uploadBrandAsset(file: File, name: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${name}.${ext}`;
  const { error } = await supabase.storage
    .from('brand')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('brand').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
