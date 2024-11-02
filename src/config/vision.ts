import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(imagePath: string): Promise<string> {
    try {
        // Créer un worker Tesseract
        const worker = await createWorker('fra');

        // Reconnaître le texte
        const { data: { text } } = await worker.recognize(imagePath);

        // Libérer le worker
        await worker.terminate();

        // Normalisation plus robuste
        const normalizedText = text
            .replace(/\s+/g, ' ')
            .replace(/[«»""]/g, '')
            .trim();

        console.log('Normalized Text:', normalizedText);
        return normalizedText;

    } catch (error) {
        console.error('Error during OCR processing:', error);
        throw new Error('Failed to extract text from image');
    }
}

interface IdentityData {
    firstName: string;
    lastName: string;
    documentNumber: string;
    dateOfBirth: string;
    placeOfBirth: string;
    address: string;
    gender: string;
    height: string;
    issueDate: string;
    expiryDate: string;
    nin: string;
    electoralNumber: string;
    country: string; // Ajout du champ country
}

export function parseIdentityData(text: string): IdentityData {
    const data: IdentityData = {
        firstName: '',
        lastName: '',
        documentNumber: '',
        dateOfBirth: '',
        placeOfBirth: '',
        address: '',
        gender: '',
        height: '',
        issueDate: '',
        expiryDate: '',
        nin: '',
        electoralNumber: '',
        country: ''
    };

    // Nettoyage préliminaire du texte
    const cleanText = text
        .replace(/[@/\\<>()&=|]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const lines = cleanText.split(/[\n\r]+/).map(line => line.trim());

    for (const line of lines) {
        // Nom
        if (line.includes('Nom')) {
            const words = line.split(/\s+/);
            const nomIndex = words.findIndex(w => w === 'Nom');
            if (nomIndex >= 0) {
                for (let i = nomIndex + 1; i < words.length; i++) {
                    if (words[i] && words[i] !== 'x' && words[i].length > 1) {
                        data.lastName = words[i].replace(/[^A-ZÀ-Ÿ\s-]/g, '').trim();
                        break;
                    }
                }
            }
        }

        // Date de naissance et sexe (variations pour les erreurs d'OCR comme "Taie" ou "Date")
        const dobGenderMatch = line.match(/(?:Date|Taie)\s*=\s*(\d{2}\/\d{2}\/\d{4})\s*([FM])/);
        if (dobGenderMatch) {
            data.dateOfBirth = dobGenderMatch[1];
            data.gender = dobGenderMatch[2];
        }

        // Lieu de naissance
        if (line.includes('Lieu de naissance')) {
            const match = line.match(/naissance\s+(?:[0-9\s-]+)?([A-ZÀ-Ÿ\s-]+?)(?=\s+Date|$)/);
            if (match && match[1]) {
                data.placeOfBirth = match[1].trim();
            }
        }

        // Prénoms
        if (line.includes('Prénoms')) {
            const prenomMatch = line.match(/Prénoms\s+([A-ZÀ-Ÿ]+)/);
            if (prenomMatch) {
                data.firstName = prenomMatch[1];
            }
        }

        // Numéro de document
        if (line.includes('N° de la carte')) {
            const match = line.match(/\d[\d\s]+\d/);
            if (match) {
                data.documentNumber = match[0].replace(/\s+/g, '');
            }
        }

        // Taille
        const heightMatch = line.match(/(\d{2,3})\s*cm/);
        if (heightMatch) {
            data.height = heightMatch[1] + ' cm';
        }

        // Dates de délivrance
        if (line.includes('Date de délivrance')) {
            const dates = line.match(/(\d{2}\/\d{2}\/\d{4})/g);
            if (dates) {
                if (dates[0]) data.issueDate = dates[0];
                if (dates[1]) data.expiryDate = dates[1];
            }
        }

        // Adresse
        if (line.includes('Adresse du domicile')) {
            const match = line.match(/domicile\s+(.+?)(?=\s*$)/);
            if (match) {
                data.address = match[1].trim();
            }
        }

        // NIN
        if (line.includes('NIN')) {
            const match = line.match(/NIN\s+(\d[\d\s]+\d)/);
            if (match) {
                data.nin = match[1].replace(/\s+/g, ' ').trim();
            }
        }

        // Numéro électoral
        const electoralMatch = line.match(/[ée]lecteur\s+(\d+)/i);
        if (electoralMatch) {
            data.electoralNumber = electoralMatch[1];
        }

        // Région / pays
        if (line.includes('Région')) {
            const match = line.match(/Région\s+([A-ZÀ-Ÿ\s-]+)/);
            if (match && match[1]) {
                data.country = match[1].trim();
            }
        }
    }

    return data;
}
