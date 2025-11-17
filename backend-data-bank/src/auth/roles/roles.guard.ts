import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "src/users/schemas/user.schema";

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!user) throw new ForbiddenException('User not found in request');

        const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];

        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
            throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}