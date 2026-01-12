// Dummy data for search results
export interface Journal {
    title: string;
    year: number;
    publisher: string;
    journalLink: string;
    pdfLink?: string;
    abstract: string;
}

export interface SearchResult {
    answer: string;
    journals: Journal[];
}

export const dummySearchResult: SearchResult = {
    answer: "Machine learning telah merevolusi berbagai bidang penelitian, terutama dalam analisis data medis dan prediksi penyakit. Berdasarkan literatur terkini, penerapan deep learning pada citra medis menunjukkan akurasi diagnosis yang lebih tinggi dibandingkan metode tradisional [1][2]. Algoritma seperti Convolutional Neural Networks (CNN) mampu mengidentifikasi pola kompleks dalam data radiologi dengan presisi mencapai 95% [3]. Selain itu, penelitian menunjukkan bahwa ensemble learning dapat meningkatkan performa model prediksi hingga 12% [4][5].",
    journals: [
        {
            title: "Deep Learning Applications in Medical Image Analysis: Recent Advances and Future Directions",
            year: 2023,
            publisher: "Nature Medicine",
            journalLink: "https://doi.org/10.1038/s41591-023-12345",
            abstract: "Medical image analysis has been transformed by deep learning techniques. This comprehensive review examines recent advances in convolutional neural networks (CNNs), recurrent neural networks (RNNs), and generative adversarial networks (GANs) for medical imaging tasks. We discuss applications in radiology, pathology, and ophthalmology, highlighting both successes and challenges in clinical deployment."
        },
        {
            title: "Machine Learning for Disease Prediction: A Systematic Review and Meta-Analysis",
            year: 2024,
            publisher: "The Lancet Digital Health",
            journalLink: "https://doi.org/10.1016/S2589-7500(24)00123",
            abstract: "This systematic review evaluates machine learning models for disease prediction across multiple medical domains. Our meta-analysis of 156 studies reveals that ensemble methods consistently outperform single-model approaches, with average AUC improvements of 8-12%. We provide guidelines for model validation and clinical implementation."
        },
        {
            title: "Convolutional Neural Networks in Radiology: Performance Benchmarks and Clinical Integration",
            year: 2023,
            publisher: "Radiology: Artificial Intelligence",
            journalLink: "https://doi.org/10.1148/ryai.230045",
            abstract: "We present a comprehensive benchmark of CNN architectures for radiological image interpretation. Testing across 50,000 CT and MRI scans, we demonstrate that modern architectures achieve 95% accuracy in lesion detection. The study includes practical recommendations for integrating AI systems into clinical workflows while maintaining diagnostic quality."
        },
        {
            title: "Ensemble Learning Methods for Medical Diagnosis: Comparative Study",
            year: 2024,
            publisher: "Journal of Biomedical Informatics",
            journalLink: "https://doi.org/10.1016/j.jbi.2024.104321",
            abstract: "This study compares various ensemble learning techniques including random forests, gradient boosting, and stacking for medical diagnosis tasks. Results from five large healthcare datasets show that ensemble approaches reduce prediction variance by 18% and improve overall accuracy. We discuss optimal ensemble configurations for different medical applications."
        },
        {
            title: "Transfer Learning in Medical AI: Bridging the Data Gap",
            year: 2023,
            publisher: "IEEE Transactions on Medical Imaging",
            journalLink: "https://doi.org/10.1109/TMI.2023.3287654",
            abstract: "Limited labeled medical data remains a significant challenge in healthcare AI. This paper demonstrates how transfer learning from large-scale natural image datasets can improve medical image classification with small training sets. Our experiments show 40% improvement in model performance when using pre-trained networks, particularly beneficial for rare disease detection."
        }
    ]
};
