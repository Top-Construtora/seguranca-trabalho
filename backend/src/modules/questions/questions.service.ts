import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionType } from '../evaluations/entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    // Se não foi fornecida uma ordem, usar a próxima disponível
    if (!createQuestionDto.order) {
      const maxOrder = await this.questionRepository
        .createQueryBuilder('question')
        .where('question.type = :type', { type: createQuestionDto.type })
        .select('MAX(question.order)', 'maxOrder')
        .getRawOne();
      
      createQuestionDto.order = (maxOrder?.maxOrder || 0) + 1;
    }

    const question = this.questionRepository.create(createQuestionDto);
    return this.questionRepository.save(question);
  }

  async findAll(type?: QuestionType, activeOnly: boolean = true): Promise<Question[]> {
    const query = this.questionRepository.createQueryBuilder('question');

    if (type) {
      query.where('question.type = :type', { type });
    }

    if (activeOnly) {
      query.andWhere('question.is_active = :isActive', { isActive: true });
    }

    return query.orderBy('question.order', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Pergunta não encontrada');
    }

    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(id);

    // Se está mudando o tipo, ajustar a ordem
    if (updateQuestionDto.type && updateQuestionDto.type !== question.type) {
      const maxOrder = await this.questionRepository
        .createQueryBuilder('question')
        .where('question.type = :type', { type: updateQuestionDto.type })
        .select('MAX(question.order)', 'maxOrder')
        .getRawOne();
      
      updateQuestionDto.order = (maxOrder?.maxOrder || 0) + 1;
    }

    Object.assign(question, updateQuestionDto);
    return this.questionRepository.save(question);
  }

  async toggleActive(id: string): Promise<Question> {
    const question = await this.findOne(id);
    question.is_active = !question.is_active;
    return this.questionRepository.save(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.findOne(id);
    
    // Verificar se há respostas associadas
    const hasAnswers = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoin('question.answers', 'answer')
      .where('question.id = :id', { id })
      .andWhere('answer.id IS NOT NULL')
      .getCount();

    if (hasAnswers > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma pergunta que já possui respostas. Desative-a ao invés disso.'
      );
    }

    await this.questionRepository.remove(question);
    
    // Reordenar as perguntas restantes
    await this.reorderAfterDelete(question.type, question.order);
  }

  async reorderQuestions(reorderDto: ReorderQuestionsDto): Promise<Question[]> {
    const questions = await this.questionRepository.findByIds(
      reorderDto.questions.map(q => q.id)
    );

    if (questions.length !== reorderDto.questions.length) {
      throw new BadRequestException('Uma ou mais perguntas não foram encontradas');
    }

    // Verificar se todas as perguntas são do mesmo tipo
    const types = [...new Set(questions.map(q => q.type))];
    if (types.length > 1) {
      throw new BadRequestException('Todas as perguntas devem ser do mesmo tipo');
    }

    // Atualizar as ordens
    const updates = reorderDto.questions.map(({ id, order }) => {
      const question = questions.find(q => q.id === id);
      if (question) {
        question.order = order;
      }
      return question;
    }).filter(Boolean) as Question[];

    return this.questionRepository.save(updates);
  }

  private async reorderAfterDelete(type: QuestionType, deletedOrder: number): Promise<void> {
    await this.questionRepository
      .createQueryBuilder()
      .update(Question)
      .set({
        order: () => '"order" - 1',
      })
      .where('type = :type', { type })
      .andWhere('order > :deletedOrder', { deletedOrder })
      .execute();
  }

  async getQuestionsByWeight(type: QuestionType, weight: number): Promise<Question[]> {
    return this.questionRepository.find({
      where: {
        type,
        weight,
        is_active: true,
      },
      order: {
        order: 'ASC',
      },
    });
  }
}