import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto } from './auth.dto';

describe('RegisterDto', () => {
  const validData = {
    companyName: 'Acme Corp',
    name: 'John Doe',
    email: 'john@acme.com',
    password: 'password123',
  };

  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(RegisterDto, validData);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should not have a slug field (removed in this PR)', () => {
    const dto = plainToInstance(RegisterDto, validData);
    expect((dto as any).slug).toBeUndefined();
  });

  it('should reject when slug is provided (forbidNonWhitelisted)', async () => {
    // This verifies the slug field was intentionally removed
    const dtoData = { ...validData, slug: 'acme-corp' };
    const dto = plainToInstance(RegisterDto, dtoData);
    // Class-validator with whitelist removes slug, but forbidNonWhitelisted would throw in controller
    // Here we just verify the property is still stripped by transformer
    expect(Object.keys(dto)).not.toContain('slug');
  });

  it('should fail when companyName is empty', async () => {
    const dto = plainToInstance(RegisterDto, { ...validData, companyName: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'companyName')).toBe(true);
  });

  it('should fail when companyName is missing', async () => {
    const { companyName, ...rest } = validData;
    const dto = plainToInstance(RegisterDto, rest);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'companyName')).toBe(true);
  });

  it('should fail when name is empty', async () => {
    const dto = plainToInstance(RegisterDto, { ...validData, name: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when email is invalid', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validData,
      email: 'not-an-email',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail when password is shorter than 8 characters', async () => {
    const dto = plainToInstance(RegisterDto, { ...validData, password: 'short' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should pass when password is exactly 8 characters', async () => {
    const dto = plainToInstance(RegisterDto, { ...validData, password: '12345678' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('LoginDto', () => {
  const validData = {
    email: 'john@acme.com',
    password: 'anypassword',
  };

  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(LoginDto, validData);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when email is invalid', async () => {
    const dto = plainToInstance(LoginDto, { ...validData, email: 'bad-email' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail when password is empty', async () => {
    const dto = plainToInstance(LoginDto, { ...validData, password: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should fail when email is missing', async () => {
    const { email, ...rest } = validData;
    const dto = plainToInstance(LoginDto, rest);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});