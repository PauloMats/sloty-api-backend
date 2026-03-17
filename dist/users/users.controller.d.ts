import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { UpdateMeDto } from './dto/user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__UserClient<{
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        email: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateMe(user: AuthenticatedUser, dto: UpdateMeDto): import("@prisma/client").Prisma.Prisma__UserClient<{
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        email: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
