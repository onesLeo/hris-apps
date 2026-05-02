import { Controller, Post, Get, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { OfferService } from '../services/offer.service';
import { CreateOfferDto, UpdateOfferDto } from '../dto/offer.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';

@Controller('recruitment/offers')
@UseGuards(JwtAuthGuard)
export class OfferController {
  constructor(private readonly service: OfferService) {}

  @Post()
  async create(@Body() dto: CreateOfferDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query('applicationId') applicationId: string) {
    return this.service.findAllByApplication(applicationId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/submit')
  async submitForApproval(@Param('id') id: string) {
    return this.service.submitForApproval(id);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string) {
    return this.service.acceptOffer(id);
  }
}
