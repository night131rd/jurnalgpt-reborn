const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SUPABASE_URL or SUPABASE_KEY is missing');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugQuery() {
    console.log('Fetching all payment intents...');
    const { data: allIntents, error: error1 } = await supabaseAdmin
        .from('payment_intents')
        .select('*');

    if (error1) console.error('Error 1:', error1);
    else console.log('All Intents Count:', allIntents.length, allIntents.map(i => ({ id: i.id, status: i.status })));

    console.log('\nFetching pending payments with joins...');
    const { data, error } = await supabaseAdmin
        .from('payment_intents')
        .select(`
            id,
            user_id,
            plan_type,
            status,
            created_at,
            profiles:user_id (email),
            payment_proofs:payment_intents (image_url, paid_amount)
        `)
        .eq('status', 'waiting_verification');

    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Result:', JSON.stringify(data, null, 2));
    }
}

debugQuery();
