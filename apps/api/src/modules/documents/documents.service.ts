import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentsService {
  private documents = [
    { id: '1', name: 'Póliza_Auto_12345.pdf', type: 'POLICY', size: 245000, uploadedAt: new Date(), status: 'PROCESSED' },
    { id: '2', name: 'DNI_Cliente.pdf', type: 'IDENTITY', size: 180000, uploadedAt: new Date(), status: 'PROCESSED' },
    { id: '3', name: 'Parte_Siniestro.pdf', type: 'CLAIM', size: 320000, uploadedAt: new Date(), status: 'PENDING' },
  ];

  async findAll() {
    return this.documents;
  }

  async findOne(id: string) {
    return this.documents.find(doc => doc.id === id);
  }

  async upload(file: any) {
    const newDoc = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type || 'OTHER',
      size: file.size,
      uploadedAt: new Date(),
      status: 'PENDING',
    };
    this.documents.push(newDoc);
    return newDoc;
  }

  async process(id: string) {
    const doc = this.documents.find(d => d.id === id);
    if (doc) {
      doc.status = 'PROCESSED';
      return { ...doc, extractedData: { text: 'Sample extracted text', entities: [] } };
    }
    return null;
  }

  async delete(id: string) {
    const index = this.documents.findIndex(d => d.id === id);
    if (index !== -1) {
      this.documents.splice(index, 1);
      return { success: true };
    }
    return { success: false };
  }
}
