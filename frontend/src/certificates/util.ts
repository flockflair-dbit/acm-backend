import type { CertificateInterface, CertificateRawInterface } from './types';

const endpoint = 'https://api-ap-south-1.hygraph.com/v2/clxtbvihi02ir07wgpbijof3g/master?query=query%20Certificates%20%7B%0A%20%20certificates%20%7B%0A%20%20%20%20acmId%0A%20%20%20%20certificateId%0A%20%20%20%20name%0A%20%20%20%20certificateImage%20%7B%0A%20%20%20%20%20%20fileName%0A%20%20%20%20%20%20size%0A%20%20%20%20%20%20url%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&operationName=Certificates';

const getCertificatesByAcmId = async (acmId: string): Promise<CertificateInterface[]> => {
    const query = `
        query Certificates {
            certificates(where: { acmId: "${acmId}" }) {
                acmId
                certificateId
                name
                certificateImage {
                    fileName
                    size
                    url
                }
            }
        }
    `;
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });
    const json = await res.json();
    const data: CertificateRawInterface[] = json.data.certificates;
    const certificates: CertificateInterface[] = [];

    for (const certificate of data) {
        const temp: CertificateInterface = {
            acmId: certificate.acmId,
            certificateId: certificate.certificateId,
            name: certificate.name,
            imageUrl: certificate.certificateImage.url,
            fileName: certificate.certificateImage.fileName,
            fileSize: certificate.certificateImage.size,
        };
        certificates.push(temp);
    }

    return certificates;
};

export { getCertificatesByAcmId };