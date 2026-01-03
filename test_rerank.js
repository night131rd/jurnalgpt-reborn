const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testRerank() {
    const apiKeysStr = process.env.LANGSEARCH_API_KEYS;
    if (!apiKeysStr) {
        console.error('No LANGSEARCH_API_KEYS found');
        return;
    }

    const apiKeys = apiKeysStr.split(',').map(k => k.trim()).filter(Boolean);
    const apiKey = apiKeys[0];
    console.log('Using API Key:', apiKey.substring(0, 8) + '...');

    const query = "test query";
    const documentsStrings = ["This is a test document about AI.", "Another document about science."];
    const documentsObjects = [{ text: "This is a test document about AI." }, { text: "Another document about science." }];

    const formats = [
        { name: "Strings Array", docs: documentsStrings },
        { name: "Objects Array", docs: documentsObjects }
    ];

    for (const format of formats) {
        console.log(`\nTesting format: ${format.name}`);
        try {
            const response = await fetch('https://api.langsearch.com/v1/rerank', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'langsearch-reranker-v1',
                    query: query,
                    documents: format.docs,
                    top_n: 1
                })
            });

            const data = await response.json();
            console.log('Status:', response.status);
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

testRerank();
