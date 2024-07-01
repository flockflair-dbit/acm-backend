export interface CertificateRawInterface {
    acmId: string;
    certificateId: string;
    name: string;
    certificateImage: {
        fileName: string;
        size: number;
        url: string;
    };
}

export interface CertificateInterface {
    acmId: string;
    certificateId: string;
    name: string;
    imageUrl: string;
    fileName: string;
    fileSize: number;
}