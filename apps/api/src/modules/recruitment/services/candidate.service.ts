import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CandidateRepository } from '../repositories/candidate.repository';
import type { CreateCandidateDto, UpdateCandidateDto } from '../dto/candidate.dto';
import type { CandidateSnapshot } from '../types/candidate.types';
import { RequestContext } from '../../../common/context/request-context';

@Injectable()
export class CandidateService {
  constructor(private readonly repository: CandidateRepository) {}

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  async create(dto: CreateCandidateDto): Promise<CandidateSnapshot> {
    const existing = await this.repository.findByEmail(this.tenantId(), dto.email);
    if (existing) {
      throw new BadRequestException(`A candidate with email ${dto.email} already exists.`);
    }
    return this.repository.create(this.tenantId(), dto);
  }

  async update(id: string, dto: UpdateCandidateDto): Promise<CandidateSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Candidate ${id} not found`);
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.repository.findByEmail(this.tenantId(), dto.email);
      if (emailTaken) {
        throw new BadRequestException(`A candidate with email ${dto.email} already exists.`);
      }
    }

    const updated = await this.repository.update(this.tenantId(), id, dto);
    return updated!;
  }

  async anonymise(id: string): Promise<CandidateSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Candidate ${id} not found`);
    }

    const anonymised = await this.repository.anonymise(this.tenantId(), id);
    return anonymised!;
  }

  async findById(id: string): Promise<CandidateSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Candidate ${id} not found`);
    }
    return existing;
  }

  async findAll(): Promise<CandidateSnapshot[]> {
    return this.repository.findAll(this.tenantId());
  }
}
