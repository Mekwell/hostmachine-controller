import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  create(createTicketDto: CreateTicketDto) {
    const ticket = this.ticketsRepository.create(createTicketDto);
    return this.ticketsRepository.save(ticket);
  }

  findAll() {
    return this.ticketsRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['server', 'node'],
    });
  }

  findOne(id: string) {
    return this.ticketsRepository.findOne({
      where: { id },
      relations: ['server', 'node'],
    });
  }

  async resolve(id: string, resolution: string) {
    const ticket = await this.findOne(id);
    if (ticket) {
        ticket.status = TicketStatus.RESOLVED;
        ticket.resolution = resolution;
        return this.ticketsRepository.save(ticket);
    }
    return null;
  }
  
  remove(id: string) {
    return this.ticketsRepository.delete(id);
  }
}
