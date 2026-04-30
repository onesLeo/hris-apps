import { Controller, Post, Get, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApplicationService } from '../services/application.service';
import { CreateApplicationDto, AdvanceApplicationStageDto } from '../dto/application.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('recruitment/applications')
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(private readonly service: ApplicationService) {}

  @Post()
  async create(@Body() dto: CreateApplicationDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query('requisitionId') requisitionId: string) {
    return this.service.findAllByRequisition(requisitionId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/advance')
  async advanceStage(@Param('id') id: string, @Body() dto: AdvanceApplicationStageDto) {
    return this.service.advanceStage(id, dto);
  }
}
