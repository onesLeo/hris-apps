import { Controller, Post, Get, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { InterviewService } from '../services/interview.service';
import { CreateInterviewDto, SubmitScorecardDto } from '../dto/interview.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';

@Controller('recruitment/interviews')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  @Post()
  async create(@Body() dto: CreateInterviewDto) {
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

  @Post(':id/scorecards')
  async submitScorecard(@Param('id') id: string, @Body() dto: SubmitScorecardDto) {
    return this.service.submitScorecard(id, dto);
  }
}
