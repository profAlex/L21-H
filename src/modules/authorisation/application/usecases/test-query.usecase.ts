import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { SessionsCommandRepository } from '../../infrastructure/session/sessions.command-repository';

export class TestQuery extends Query<void> {
    constructor(
        // public readonly userId: string,
        // public readonly req: Request,
    ) {
        super();
    }
}

@QueryHandler(TestQuery)
export class TestQueryHandler implements IQueryHandler<TestQuery> {
    constructor(
        // private usersExternalQueryRepository: UsersExternalQueryRepository,
        // private postsQueryRepository: PostsQueryRepository,
        // @InjectModel(Session.name) private SessionModel: SessionModelType,
        private sessionsCommandRepository: SessionsCommandRepository,
        // private jwtTokenProvider: JwtTokenProvider,
    ) {}

    async execute(
        // { userId, req }: LoginUser
    ): Promise<void> {

    }
}
