import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'JurnalGPT – AI untuk Jurnal Ilmiah',
        short_name: 'JurnalGPT',
        description: 'Platform AI untuk mencari, merangkum, dan memahami jurnal ilmiah',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
