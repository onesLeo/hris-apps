import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CandidateService } from '../services/candidate.service';
import { CreateCandidateDto, UpdateCandidateDto } from '../dto/candidate.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('recruitment/candidates')
@UseGuards(JwtAuthGuard)
export class CandidateController {
  constructor(private readonly service: CandidateService) {}

  @Post()
  async create(@Body() dto: CreateCandidateDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/anonymise')
  async anonymise(@Param('id') id: string) {
    return this.service.anonymise(id);
  }
}
