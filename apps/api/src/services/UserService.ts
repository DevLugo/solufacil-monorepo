import bcrypt from 'bcryptjs'
import { GraphQLError } from 'graphql'
import type { User, UserRole, PrismaClient } from '@solufacil/database'
import { UserRepository } from '../repositories/UserRepository'

export interface CreateUserInput {
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserInput {
  email?: string
  role?: UserRole
}

export class UserService {
  private userRepository: UserRepository

  constructor(prisma: PrismaClient) {
    this.userRepository = new UserRepository(prisma)
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  async findByIdWithEmployee(id: string) {
    return this.userRepository.findByIdWithEmployee(id)
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email)
  }

  async findMany(options?: {
    role?: UserRole
    limit?: number
    offset?: number
  }): Promise<User[]> {
    return this.userRepository.findMany(options)
  }

  async create(input: CreateUserInput): Promise<User> {
    // Verificar si el email ya existe
    const emailExists = await this.userRepository.emailExists(input.email)
    if (emailExists) {
      throw new GraphQLError('Email already registered', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(input.password, 10)

    return this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      role: input.role,
    })
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    // Verificar que el usuario existe
    const exists = await this.userRepository.exists(id)
    if (!exists) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (input.email) {
      const emailExists = await this.userRepository.emailExists(input.email, id)
      if (emailExists) {
        throw new GraphQLError('Email already registered', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }
    }

    return this.userRepository.update(id, input)
  }

  async delete(id: string): Promise<boolean> {
    // Verificar que el usuario existe
    const exists = await this.userRepository.exists(id)
    if (!exists) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return this.userRepository.delete(id)
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Obtener usuario
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Verificar password actual
    const isValidPassword = await bcrypt.compare(oldPassword, user.password)
    if (!isValidPassword) {
      throw new GraphQLError('Invalid current password', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    // Hash del nuevo password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await this.userRepository.update(userId, { password: hashedPassword })
    return true
  }

  async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) return null

    // TODO: Temporarily disabled password verification for development
    // const isValid = await bcrypt.compare(password, user.password)
    // if (!isValid) return null

    return user
  }
}
