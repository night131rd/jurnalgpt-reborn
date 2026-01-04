import { supabaseAdmin } from '@/lib/supabase';

export interface KeyLimitInfo {
    provider: string;
    model: string;
    keyName: string;
    limitType: 'rpm' | 'rph' | 'rpd' | 'tpm' | 'tph' | 'tpd';
    remaining: number;
    resetInSeconds: number;
}

export class KeyManager {
    private static instance: KeyManager;
    private keys: Map<string, string[]> = new Map();

    private constructor() {
        this.loadKeys();
    }

    public static getInstance(): KeyManager {
        if (!KeyManager.instance) {
            KeyManager.instance = new KeyManager();
        }
        return KeyManager.instance;
    }

    private loadKeys() {
        // For now focusing on Cerebras, but extensible
        const cerebrasKeys = (process.env.CEREBRAS_API_KEYS?.split(',') ?? [])
            .map(k => k.trim())
            .filter(k => k !== '');

        if (cerebrasKeys.length > 0) {
            this.keys.set('cerebras', cerebrasKeys);
        }
    }

    public async getAvailableKey(provider: string, model: string): Promise<{ key: string, name: string }> {
        const providerKeys = this.keys.get(provider) ?? [];
        if (providerKeys.length === 0) {
            throw new Error(`No keys found for provider: ${provider}`);
        }

        // Check DB for blocked keys
        let limitedNames = new Set<string>();
        let dbRetries = 2;
        while (dbRetries > 0) {
            try {
                const { data: limitedKeys, error } = await supabaseAdmin
                    .from('api_key_limits')
                    .select('key_name')
                    .eq('provider', provider)
                    .eq('model', model)
                    .eq('status', 'limited')
                    .gt('reset_at', new Date().toISOString());

                if (error) {
                    console.warn(`Supabase error fetching limited keys (retry ${3 - dbRetries}/2):`, error.message);
                    dbRetries--;
                    if (dbRetries > 0) continue;
                } else {
                    limitedNames = new Set(limitedKeys?.map(k => k.key_name) ?? []);
                    break;
                }
            } catch (e: any) {
                console.warn(`Network error fetching limited keys (retry ${3 - dbRetries}/2):`, e.message);
                dbRetries--;
                if (dbRetries === 0) {
                    console.warn('Supabase unreachable after retries (using all keys as fallback)');
                }
            }
        }

        // Find keys that are NOT limited
        const availableKeys = providerKeys
            .map((key, index) => ({ key, name: `${provider.toUpperCase()}_KEY_${index + 1}` }))
            .filter(k => !limitedNames.has(k.name));

        if (availableKeys.length === 0) {
            // Fallback: use any key if all are marked limited (safety)
            const selected = providerKeys[Math.floor(Math.random() * providerKeys.length)];
            return { key: selected, name: `${provider.toUpperCase()}_KEY_1` }; // Simplified name for fallback
        }

        // Pick a random available key
        const selected = availableKeys[Math.floor(Math.random() * availableKeys.length)];
        return selected;
    }

    public async reportLimit(info: KeyLimitInfo) {
        const resetAt = new Date();
        resetAt.setSeconds(resetAt.getSeconds() + info.resetInSeconds);

        try {
            const { error } = await supabaseAdmin
                .from('api_key_limits')
                .upsert({
                    provider: info.provider,
                    model: info.model,
                    key_name: info.keyName,
                    limit_type: info.limitType,
                    remaining: info.remaining,
                    reset_at: resetAt.toISOString(),
                    status: 'limited',
                    last_seen_at: new Date().toISOString()
                }, {
                    onConflict: 'provider,model,key_name,limit_type'
                });

            if (error) {
                console.warn('Error reporting limit to Supabase:', error.message);
            }
        } catch (e: any) {
            console.warn('Network error reporting limit to Supabase:', e.message);
        }
    }
}
export const keyManager = KeyManager.getInstance();
