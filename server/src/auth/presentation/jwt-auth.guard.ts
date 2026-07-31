import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard access JWT */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
