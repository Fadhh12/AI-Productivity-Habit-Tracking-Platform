import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';

class PushKeysDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  auth!: string;
}

export class SubscribePushDto {
  @IsUrl({ protocols: ['https'], require_protocol: true, require_tld: false })
  @MaxLength(2048)
  endpoint!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

export class UnsubscribePushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  endpoint!: string;
}
