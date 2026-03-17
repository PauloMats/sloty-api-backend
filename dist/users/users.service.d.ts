import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(userId: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        phone: string | null;
        email: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateMe(userId: string, dto: UpdateMeDto): import("@prisma/client").Prisma.Prisma__UserClient<{
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
