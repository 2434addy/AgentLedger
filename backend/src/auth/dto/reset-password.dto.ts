import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[a-f0-9]+$/, { message: 'Invalid token format' })
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}';:"\\|,.<>\/?])/,
    {
      message:
        'Password must include uppercase, lowercase, number, and special character',
    },
  )
  newPassword: string;
}
