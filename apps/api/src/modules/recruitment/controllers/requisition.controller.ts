import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { RequisitionService } from '../services/requisition.service';
import { CreateRequisitionDto, UpdateRequisitionDto } from '../dto/requisition.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('recruitment/requisitions')
@UseGuards(JwtAuthGuard)
export class RequisitionController {
  constructor(private readonly service: RequisitionService) {}

  @Post()
  async create(@Body() dto: CreateRequisitionDto) {
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
  async update(@Param('id') id: string, @Body() dto: UpdateRequisitionDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/submit')
  async submitForApproval(@Param('id') id: string) {
    return this.service.submitForApproval(id);
  }
}
