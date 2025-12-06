import { GraphQLScalarType, Kind } from 'graphql'
import { DateTimeResolver, JSONResolver } from 'graphql-scalars'
import { Decimal } from 'decimal.js'

// Custom Decimal scalar
export const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'Decimal custom scalar type for precise numeric calculations',
  serialize(value: unknown): string {
    if (value instanceof Decimal) {
      return value.toString()
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Decimal(value).toString()
    }
    throw new Error('Decimal can only serialize Decimal, string, or number values')
  },
  parseValue(value: unknown): Decimal {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Decimal(value)
    }
    throw new Error('Decimal can only parse string or number values')
  },
  parseLiteral(ast): Decimal {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return new Decimal(ast.value)
    }
    throw new Error('Decimal can only parse string, int, or float values')
  },
})

// Export all scalars
export const scalars = {
  DateTime: DateTimeResolver,
  Decimal: DecimalScalar,
  JSON: JSONResolver,
}
