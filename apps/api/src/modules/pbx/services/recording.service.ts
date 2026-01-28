import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Recording } from '../entities/recording.entity';
import { Call } from '../entities/call.entity';
import { RecordingStatus, IRecording, IRecordingConfig } from '../interfaces/recording.interface';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly localStoragePath: string;
  private readonly retentionDays: number;

  constructor(
    @InjectRepository(Recording)
    private readonly recordingRepository: Repository<Recording>,
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.localStoragePath = this.configService.get<string>('PBX_RECORDING_PATH', '/var/spool/asterisk/monitor');
    this.retentionDays = this.configService.get<number>('PBX_RECORDING_RETENTION_DAYS', 1095); // 3 años por defecto
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET', '');

    if (this.configService.get<string>('STORAGE_PROVIDER') === 's3') {
      this.s3Client = new S3Client({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
        },
      });
    }
  }

  async startRecording(callId: string, config: IRecordingConfig): Promise<IRecording> {
    this.logger.log(`Starting recording for call ${callId}`);

    const call = await this.callRepository.findOne({ where: { id: callId } });
    if (!call) {
      throw new Error(`Call ${callId} not found`);
    }

    const filename = this.generateFilename(call.uniqueId, config.format);
    const filepath = path.join(this.localStoragePath, filename);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.retentionDays);

    const recording = this.recordingRepository.create({
      callId,
      filename,
      filepath,
      duration: 0,
      size: 0,
      format: config.format,
      status: RecordingStatus.RECORDING,
      expiresAt,
    });

    await this.recordingRepository.save(recording);

    await this.callRepository.update(callId, {
      recordingUrl: filepath,
    });

    this.eventEmitter.emit('pbx.recording.started', {
      recordingId: recording.id,
      callId,
    });

    return recording as IRecording;
  }

  async stopRecording(callId: string): Promise<IRecording> {
    this.logger.log(`Stopping recording for call ${callId}`);

    const recording = await this.recordingRepository.findOne({
      where: { callId, status: RecordingStatus.RECORDING },
    });

    if (!recording) {
      throw new Error(`Active recording not found for call ${callId}`);
    }

    const call = await this.callRepository.findOne({ where: { id: callId } });

    recording.status = RecordingStatus.COMPLETED;
    recording.duration = call?.duration || 0;

    if (fs.existsSync(recording.filepath)) {
      const stats = fs.statSync(recording.filepath);
      recording.size = stats.size;
    }

    await this.recordingRepository.save(recording);

    this.eventEmitter.emit('pbx.recording.stopped', {
      recordingId: recording.id,
      callId,
    });

    await this.processRecording(recording.id);

    return recording as IRecording;
  }

  private async processRecording(recordingId: string): Promise<void> {
    this.logger.log(`Processing recording ${recordingId}`);

    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    try {
      recording.status = RecordingStatus.PROCESSING;
      await this.recordingRepository.save(recording);

      await this.encryptRecording(recording);

      if (this.configService.get<string>('STORAGE_PROVIDER') === 's3') {
        await this.uploadToS3(recording);
      } else if (this.configService.get<string>('STORAGE_PROVIDER') === 'azure') {
        await this.uploadToAzure(recording);
      }

      recording.status = RecordingStatus.UPLOADED;
      await this.recordingRepository.save(recording);

      this.eventEmitter.emit('pbx.recording.processed', {
        recordingId: recording.id,
        callId: recording.callId,
      });

      this.logger.log(`Recording ${recordingId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process recording ${recordingId}`, error);
      recording.status = RecordingStatus.FAILED;
      await this.recordingRepository.save(recording);

      this.eventEmitter.emit('pbx.recording.failed', {
        recordingId: recording.id,
        error: error.message,
      });
    }
  }

  private async encryptRecording(recording: Recording): Promise<void> {
    this.logger.debug(`Encrypting recording ${recording.id}`);

    if (!fs.existsSync(recording.filepath)) {
      throw new Error(`Recording file not found: ${recording.filepath}`);
    }

    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const input = fs.createReadStream(recording.filepath);
    const encryptedPath = `${recording.filepath}.encrypted`;
    const output = fs.createWriteStream(encryptedPath);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    await new Promise<void>((resolve, reject) => {
      input
        .pipe(cipher)
        .pipe(output)
        .on('finish', () => resolve())
        .on('error', (error) => reject(error));
    });

    fs.unlinkSync(recording.filepath);
    fs.renameSync(encryptedPath, recording.filepath);

    recording.encryptionKey = key.toString('base64');
    recording.encryptionIV = iv.toString('base64');

    await this.recordingRepository.save(recording);

    this.logger.debug(`Recording ${recording.id} encrypted successfully`);
  }

  private async uploadToS3(recording: Recording): Promise<void> {
    this.logger.debug(`Uploading recording ${recording.id} to S3`);

    const fileContent = fs.readFileSync(recording.filepath);
    const key = `recordings/${recording.callId}/${recording.filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: this.getContentType(recording.format),
      Metadata: {
        callId: recording.callId,
        recordingId: recording.id,
        encrypted: 'true',
      },
    });

    await this.s3Client.send(command);

    recording.storageUrl = `s3://${this.bucketName}/${key}`;
    recording.storageProvider = 's3';
    recording.uploadedAt = new Date();

    await this.recordingRepository.save(recording);

    if (this.configService.get<boolean>('DELETE_LOCAL_AFTER_UPLOAD', true)) {
      fs.unlinkSync(recording.filepath);
    }

    this.logger.debug(`Recording ${recording.id} uploaded to S3 successfully`);
  }

  private async uploadToAzure(recording: Recording): Promise<void> {
    this.logger.warn('Azure Blob Storage upload not implemented yet');
    throw new Error('Azure Blob Storage upload not implemented');
  }

  async getRecording(recordingId: string): Promise<Buffer | string> {
    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    if (recording.storageProvider === 's3') {
      return this.downloadFromS3(recording);
    } else if (fs.existsSync(recording.filepath)) {
      return this.decryptRecording(recording);
    } else {
      throw new Error(`Recording file not found: ${recording.filepath}`);
    }
  }

  async getRecordingUrl(recordingId: string, expiresIn = 3600): Promise<string> {
    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    if (recording.storageProvider === 's3') {
      const key = recording.storageUrl.replace(`s3://${this.bucketName}/`, '');

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } else {
      return recording.filepath;
    }
  }

  private async downloadFromS3(recording: Recording): Promise<Buffer> {
    this.logger.debug(`Downloading recording ${recording.id} from S3`);

    const key = recording.storageUrl.replace(`s3://${this.bucketName}/`, '');

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as any;

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const encryptedData = Buffer.concat(chunks);

    return this.decryptBuffer(encryptedData, recording);
  }

  private async decryptRecording(recording: Recording): Promise<Buffer> {
    this.logger.debug(`Decrypting recording ${recording.id}`);

    const encryptedData = fs.readFileSync(recording.filepath);

    return this.decryptBuffer(encryptedData, recording);
  }

  private decryptBuffer(encryptedData: Buffer, recording: Recording): Buffer {
    if (!recording.encryptionKey || !recording.encryptionIV) {
      return encryptedData;
    }

    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(recording.encryptionKey, 'base64');
    const iv = Buffer.from(recording.encryptionIV, 'base64');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  async deleteRecording(recordingId: string): Promise<void> {
    this.logger.log(`Deleting recording ${recordingId}`);

    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    if (recording.storageProvider === 's3') {
      await this.deleteFromS3(recording);
    }

    if (fs.existsSync(recording.filepath)) {
      fs.unlinkSync(recording.filepath);
    }

    await this.recordingRepository.delete(recordingId);

    this.logger.log(`Recording ${recordingId} deleted successfully`);
  }

  private async deleteFromS3(recording: Recording): Promise<void> {
    const key = recording.storageUrl.replace(`s3://${this.bucketName}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async cleanupExpiredRecordings(): Promise<number> {
    this.logger.log('Cleaning up expired recordings');

    const expiredRecordings = await this.recordingRepository.find({
      where: {
        expiresAt: LessThan(new Date()),
      },
    });

    let deletedCount = 0;

    for (const recording of expiredRecordings) {
      try {
        await this.deleteRecording(recording.id);
        deletedCount++;
      } catch (error) {
        this.logger.error(`Failed to delete expired recording ${recording.id}`, error);
      }
    }

    this.logger.log(`Cleaned up ${deletedCount} expired recordings`);

    return deletedCount;
  }

  async getRecordingsByCallId(callId: string): Promise<IRecording[]> {
    const recordings = await this.recordingRepository.find({
      where: { callId },
      order: { createdAt: 'DESC' },
    });

    return recordings as IRecording[];
  }

  async findRecordings(filters: {
    callId?: string;
    status?: RecordingStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ recordings: IRecording[]; total: number }> {
    const queryBuilder = this.recordingRepository.createQueryBuilder('recording');

    if (filters.callId) {
      queryBuilder.andWhere('recording.callId = :callId', {
        callId: filters.callId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('recording.status = :status', {
        status: filters.status,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('recording.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('recording.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const total = await queryBuilder.getCount();

    if (filters.page && filters.limit) {
      queryBuilder.skip((filters.page - 1) * filters.limit).take(filters.limit);
    }

    const recordings = await queryBuilder.orderBy('recording.createdAt', 'DESC').getMany();

    return {
      recordings: recordings as IRecording[],
      total,
    };
  }

  private generateFilename(uniqueId: string, format: string): string {
    const timestamp = Date.now();
    return `recording-${uniqueId}-${timestamp}.${format}`;
  }

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
    };

    return contentTypes[format] || 'application/octet-stream';
  }
}
